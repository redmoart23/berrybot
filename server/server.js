import express from "express";
import cors from "cors";

const app = express();
app.use(cors())
app.use(express.json());


app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Welcome to ChatBerry'
  });
})


app.post('/', async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const response = await fetch("", {
      method: 'POST',
      body: JSON.stringify({ message: prompt }),
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    res.status(200).send({
      bot: response
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
})

app.listen(5000, () => console.log('Server is running on port http://localhost:5000'));


