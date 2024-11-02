const inputField = document.getElementById('prompt-input');
const sendButton = document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages');
const emptyChatMessage = document.getElementById('empty-chat-message');
const chatListContainer = document.getElementById('chat-list');
const newChatButton = document.getElementById('new-chat-btn');
let activeChatIndex = null;
let chats = [];
function formatMessage(message) {
    message = message.replace(/\*\*\*(.*?)\*\*\*/g, '<b><i>$1</i></b>');
    message = message.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    message = message.replace(/\*(.*?)\*/g, '<i>$1</i>');
    message = message.replace(/\n/g, '<br>');
    return message;
}
function updateChatList() {
    chatListContainer.innerHTML = '';
    chats.forEach((chat, index) => {
        const chatItem = document.createElement('div');
        chatItem.classList.add('chat-item');
        chatItem.textContent = chat.title;
        const removeButton = document.createElement('span');
        removeButton.textContent = '✖';
        removeButton.classList.add('remove-chat');
        removeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            removeChat(index);
        });
        chatItem.appendChild(removeButton);
        if (index === activeChatIndex) {
            chatItem.classList.add('active');
        }
        chatItem.addEventListener('click', () => loadChat(index));
        chatItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const input = document.createElement('input');
            input.type = 'text';
            input.value = chat.title;
            input.classList.add('rename-input');
            input.style.width = '150px';
            if (index === activeChatIndex) {
                input.style.backgroundColor = '#00aaff';
            } else {
                input.style.backgroundColor = '#444';
            }
            chatItem.innerHTML = '';
            chatItem.appendChild(input);
            input.focus();
            input.addEventListener('blur', () => {
                const newName = input.value.trim();
                if (newName) {
                    chat.title = newName;
                }
                updateChatList();
            });
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const newName = input.value.trim();
                    if (newName) {
                        chat.title = newName;
                    }
                    updateChatList();
                }
            });
        });
        chatListContainer.appendChild(chatItem);
    });
}
function loadChat(index) {
    activeChatIndex = index;
    messagesContainer.innerHTML = '';
    chats[index].messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', msg.type);
        messageElement.innerHTML = formatMessage(msg.text);
        messagesContainer.appendChild(messageElement);
    });
    emptyChatMessage.style.display = chats[index].messages.length === 0 ? 'block' : 'none';
    updateChatList();
}
function newChat(title) {
    const newChatObject = { title: title, messages: [] };
    chats.push(newChatObject);
    activeChatIndex = chats.length - 1;
    messagesContainer.innerHTML = '';
    emptyChatMessage.style.display = 'block';
    updateChatList();
}
function removeChat(index) {
    chats.splice(index, 1);
    if (activeChatIndex === index) {
        activeChatIndex = null;
        messagesContainer.innerHTML = '';
        emptyChatMessage.style.display = 'block';
    } else if (activeChatIndex > index) {
        activeChatIndex--;
    }
    updateChatList();
}
sendButton.addEventListener('click', sendMessage);
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
async function sendMessage() {
    const inputText = inputField.value.trim();
    if (!inputText) return;
    if (activeChatIndex === null) {
        newChat('Untitled Chat');
    }
    const currentChat = chats[activeChatIndex];
    currentChat.messages.push({ text: inputText, type: 'user-message' });
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.innerHTML = formatMessage(inputText);
    messagesContainer.appendChild(messageElement);
    if (currentChat.title === 'Untitled Chat') {
        currentChat.title = inputText;
        updateChatList();
    }
    inputField.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    const typingMessageElement = document.createElement('div');
    typingMessageElement.classList.add('message', 'bot-typing');
    typingMessageElement.textContent = "Bot is typing...";
    messagesContainer.appendChild(typingMessageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    const previousMessages = buildPreviousMessages(currentChat.messages);
    const response = await getBotResponse(inputText, previousMessages);
    typingMessageElement.remove();
    currentChat.messages.push({ text: response, type: 'bot-message' });
    const botMessageElement = document.createElement('div');
    botMessageElement.classList.add('message', 'bot-message');
    botMessageElement.innerHTML = formatMessage(response);
    messagesContainer.appendChild(botMessageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    updateChatList();
}
function buildPreviousMessages(messages) {
    let previousMessages = [];
    messages.forEach((msg) => {
        if (msg.type === 'user-message') {
            previousMessages.push({ "user": [msg.text] });
        } else if (msg.type === 'bot-message') {
            previousMessages.push({ "ai": [msg.text] });
        }
    });
    return previousMessages;
}
async function getBotResponse(prompt, previousMessages) {
    const url = `https://charbot.ape3d.com/?prompt=${encodeURIComponent(prompt)}&previousemessages=${encodeURIComponent(JSON.stringify(previousMessages))}`;
    const response = await fetch(url);
    const data = await response.text();
    return data;
}
newChatButton.addEventListener('click', () => {
    newChat('Untitled Chat');
}); 