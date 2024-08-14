from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import firestore
from firebase_admin import credentials
from enum import Enum
import json

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Load Firebase Admin SDK credentials from environment variable
credentials_json = os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON')
if not credentials_json:
    raise RuntimeError("Environment variable GOOGLE_APPLICATION_CREDENTIALS_JSON is not set")

# Parse JSON
try:
    cred_dict = json.loads(credentials_json)
    cred = credentials.Certificate(cred_dict)
except json.JSONDecodeError:
    raise RuntimeError("Invalid JSON format in GOOGLE_APPLICATION_CREDENTIALS_JSON")
except Exception as e:
    raise RuntimeError(f"Error loading Firebase credentials: {e}")

firebase_admin.initialize_app(cred)
db = firestore.client()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Adjust as necessary
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Generative AI model
genai.configure(api_key=os.getenv('API_KEY'))

class MessageSenderType(str, Enum):
    user = 'user'
    bot = 'bot'

# Define Pydantic models
class Message(BaseModel):
    text: str
    index: int
    senderType: MessageSenderType

@app.get('/chats')
def get_chat(user_id: str):
    chat_ref = db.collection('chats').where("userId", "==", user_id)
    chats = chat_ref.get()

    if chats:
        chat = chats[0]  # Get the first (and only) document
        return chat.to_dict()
    else:
        return {"message": "No document found for the specified userId."}

@app.get('/prompt')
def get_response(user_id: str, prompt: str, index: int = None):
    system_instruction = "You are having a chat with a person. It's possible that this is the start of chat. In that case you don't need to do anything. Otherwise following is the past chat summary of you with the user: "
    chat = get_chat(user_id)
    for message in chat['messages']:
        system_instruction = system_instruction + message['senderType'] + ':' + message['text'] + ' '

    model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=system_instruction)
    # Generate content using Generative AI model
    response = model.generate_content(prompt)
    generated_text = response.text.strip()

    # Create the user's message
    user_message = Message(
        text=prompt,
        index=index if index is not None else -1,  # Use -1 if index is not provided
        senderType=MessageSenderType.user
    )
    
    # Create the bot's message
    bot_message = Message(
        text=generated_text,
        index=index if index is not None else -1,  # Bot message will get a new index
        senderType=MessageSenderType.bot
    )

    # Call create_or_update_message to handle both messages
    return create_or_update_message(user_id, user_message, bot_message)

def create_or_update_message(user_id: str, user_message: Message, bot_message: Message):
    chats_ref = db.collection('chats')
    query = chats_ref.where("userId", "==", user_id).limit(1).get()

    if not query:
        # No chat found, create a new one
        chat_data = {
            "userId": user_id,
            "messages": [
                user_message.dict(),
                bot_message.dict()
            ]
        }
        chats_ref.add(chat_data)
        return {"message": "Chat created and messages added.", "data": chat_data}

    # Chat exists, update or add messages
    chat_doc = query[0]
    chat_data = chat_doc.to_dict()
    messages = chat_data.get("messages", [])

    if user_message.index != -1:
        user_message_updated = False
        for i, msg in enumerate(messages):
            if msg['index'] == user_message.index and msg['senderType'] == 'user':
                messages[i] = user_message.dict()  # Update existing user message
                user_message_updated = True
                break
        if not user_message_updated:
            # If index is not found, return an error
            raise HTTPException(status_code=404, detail="User message with the specified index not found")

        # Update or add corresponding bot message
        bot_message.index = user_message.index + 1  # Assuming bot message follows user message directly
        bot_message_updated = False
        for i, msg in enumerate(messages):
            if msg['index'] == bot_message.index and msg['senderType'] == 'bot':
                messages[i] = bot_message.dict()  # Update existing bot message
                bot_message_updated = True
                break
        if not bot_message_updated:
            # If bot message index is not found, append new bot message
            messages.append(bot_message.dict())
    else:
        # Find the next index for new messages
        max_index = max((msg['index'] for msg in messages if msg['index'] is not None), default=0)
        
        # Add new user message
        user_message.index = max_index + 1
        messages.append(user_message.dict())

        # Add bot message with the next index
        bot_message.index = max_index + 2
        messages.append(bot_message.dict())

    chat_doc.reference.update({"messages": messages})
    updated_chat_doc = chat_doc.reference.get()
    return {"message": "Messages updated.", "data": updated_chat_doc.to_dict()}


@app.delete('/chats')
def delete_message(user_id: str, index: int):
    chats_ref = db.collection('chats')
    query = chats_ref.where("userId", "==", user_id).limit(1).get()

    if not query:
        raise HTTPException(status_code=404, detail="Chat not found")

    chat_doc = query[0]
    chat_data = chat_doc.to_dict()
    messages = chat_data.get("messages", [])

    # Filter out the message
    updated_messages = [msg for msg in messages if msg['index'] != index]

    if len(updated_messages) == len(messages):
        raise HTTPException(status_code=404, detail="Message not found")

    chat_doc.reference.update({"messages": updated_messages})
    updated_chat_doc = chat_doc.reference.get()
    return {"message": "Message deleted.", "data": updated_chat_doc.to_dict()}
