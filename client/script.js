import bot from './assets/bot.svg';
import user from './assets/user.svg';
const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

// const historyElement = document.querySelector('.chat-history')
// const textAreaElement = document.querySelector('textarea')
const newchat = document.querySelector('.side-menu-new-chat-button');


// function clearTextArea() {
//   textAreaElement.value = "";
//   chatContainer.innerHTML = ""
// }

// function changeInput(value) {
//   const textAreaNewElement = document.querySelector("textarea");
//   textAreaNewElement.value = value;
// }

newchat.addEventListener("click", () => { alert("This feature will be available soon") })

let loadInterval;

function loader(element) {
  element.textContent = '';

  loadInterval = setInterval(() => {
    element.textContent += '.';

    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 300);
}


function typeText(element, text) {
  let index = 0;

  let interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 20)
}

function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);
  return `id-${timestamp}-${hexadecimalString}`;
}


function chatStripe(isAi, value, uniqueId) {
  return (
    `
  <div class="wrapper ${isAi && 'ai'}">
    <div class="chat">
      <div class="profile">
        <img
          src="${isAi ? bot : user}"
          alt="${isAi ? 'bot' : 'user'}"
        />
      </div>
      <div class="message" id=${uniqueId}>${value}</div>
    </div>
  </div>
  `
  )
}

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  //user's chatstripe
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'));
  //let textareaValue = textAreaElement.value
  form.reset();

  //bot's chatstripe
  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, " ", uniqueId);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);
  loader(messageDiv);

  //const response = await fetch("https://chatberry.onrender.com/predict", {
  const response = await fetch("http://localhost:8080/predict", {
    method: 'POST',
    body: JSON.stringify({ message: data.get('prompt') }),
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  clearInterval(loadInterval);
  messageDiv.innerHTML = '';

  if (response.ok) {
    const data = await response.json();

    // if (data) {
    //   const pElement = document.createElement('p')
    //   pElement.textContent = textareaValue.substring(0, 20) + "...";
    //   pElement.addEventListener('click', () => changeInput(pElement.textContent))
    //   historyElement.append(pElement)
    // }

    typeText(messageDiv, data.answer)
  } else {
    const err = await response.text();
    messageDiv.innerHTML = "Something went wrong 😞"
    alert(err);
  }
}

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    handleSubmit(e)
    const element = document.querySelector('#welcome-message');
    element.style.display = 'none';
  }
});
