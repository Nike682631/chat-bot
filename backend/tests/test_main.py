import pytest
from fastapi.testclient import TestClient
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app  # Adjust import path according to your project structure
from google.cloud import firestore
from google.auth.credentials import Credentials
import os

# Initialize the FastAPI client
client = TestClient(app)

# Use environment variables to configure Firebase settings for testing
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = './serviceAccountKey.json'

@pytest.fixture
def setup_firestore():
    """Fixture to setup Firestore database for tests."""
    # Initialize Firestore client for tests
    db = firestore.Client()
    # Clear Firestore data before each test
    # Consider creating a collection and document structure similar to your actual setup
    yield db
    # Clean up Firestore data after each test
    # For instance, deleting test collections or documents

def test_get_chat(setup_firestore):
    """Test the /chats endpoint for existing user."""
    user_id = "test_user_id"
    # Add a document with test data
    db = setup_firestore
    db.collection('chats').add({
        'userId': user_id,
        'messages': [{'text': 'Hello', 'index': 0, 'senderType': 'user'}]
    })

    response = client.get(f"/chats?user_id={user_id}")
    assert response.status_code == 200
    data = response.json()
    assert "messages" in data
    assert data['messages'] == [{'text': 'Hello', 'index': 0, 'senderType': 'user'}]

def test_get_chat_no_document(setup_firestore):
    """Test the /chats endpoint for non-existing user."""
    user_id = "nonexistent_user_id"
    response = client.get(f"/chats?user_id={user_id}")
    assert response.status_code == 200
    assert response.json() == {"message": "No document found for the specified userId."}

def test_delete_message(setup_firestore):
    """Test the /chats DELETE endpoint for an existing message."""
    user_id = "test_user_id"
    index = 0
    # Add a document with messages to Firestore
    db = setup_firestore
    db.collection('chats').add({
        'userId': user_id,
        'messages': [{'text': 'Hello', 'index': index, 'senderType': 'user'}]
    })

    response = client.delete(f"/chats?user_id={user_id}&index={index}")
    assert response.status_code == 200
    assert response.json()["message"] == "Message deleted."

    # Verify that the message was deleted
    chat_ref = db.collection('chats').where("userId", "==", user_id).limit(1).get()
    assert len(chat_ref) == 1
    chat_data = chat_ref[0].to_dict()
    assert not any(msg['index'] == index for msg in chat_data.get('messages', []))

def test_delete_message_not_found(setup_firestore):
    """Test the /chats DELETE endpoint for a non-existing message."""
    user_id = "test_user_id"
    index = 999  # Index that doesn't exist
    response = client.delete(f"/chats?user_id={user_id}&index={index}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Message not found"



def test_get_response_new_chat(setup_firestore):
    """Test the /prompt endpoint for creating a new chat with new messages."""
    user_id = "new_user_id"
    prompt = "Hello, how are you?"
    
    response = client.get(f"/prompt?user_id={user_id}&prompt={prompt}")
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["message"] == "Chat created and messages added."

    # Verify that the chat and messages were created
    db = setup_firestore
    chat_ref = db.collection('chats').where("userId", "==", user_id).limit(1).get()
    assert len(chat_ref) == 1
    chat_data = chat_ref[0].to_dict()
    assert len(chat_data['messages']) == 2
    assert chat_data['messages'][0]['text'] == prompt
    assert chat_data['messages'][1]['text'] != prompt  # Ensure the bot's response is different

def test_get_response_update_message(setup_firestore):
    """Test the /prompt endpoint for updating an existing message."""
    user_id = "existing_user_id"
    initial_prompt = "Initial message"
    updated_prompt = "Updated message"

    # Add initial chat data
    db = setup_firestore
    chat_ref = db.collection('chats').add({
        'userId': user_id,
        'messages': [
            {'text': initial_prompt, 'index': 0, 'senderType': 'user'},
            {'text': 'Bot response', 'index': 1, 'senderType': 'bot'}
        ]
    })

    # Update the user message
    response = client.get(f"/prompt?user_id={user_id}&prompt={updated_prompt}&index=0")
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["message"] == "Messages updated."

    # Verify that the message was updated
    chat_ref = db.collection('chats').where("userId", "==", user_id).limit(1).get()
    assert len(chat_ref) == 1
    chat_data = chat_ref[0].to_dict()
    messages = chat_data['messages']
    assert any(msg['text'] == updated_prompt and msg['index'] == 0 for msg in messages)



