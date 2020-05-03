/* eslint-disable no-console */
const express = require('express');
const morgan = require('morgan');

const app = express();
require('dotenv').config();
const Person = require('./models/person');


// eslint-disable-next-line consistent-return
morgan.token('body', (req) => {
  if (req.method === 'POST') {
    return JSON.stringify(req.body);
  }
});


app.use(express.static('build'));
app.use(express.json());
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));

app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>');
});

app.get('/api/persons', (req, res) => {
  Person.find({}).then((ps) => {
    res.json(ps.map((p) => p.toJSON()));
  });
});

app.get('/info', (req, res) => {
  Person.find({}).then((ps) => {
    res.send(`<p>Phone book has info for ${ps.length} people</p>${new Date()}`);
  });
});

app.get('/api/persons/:id', (req, res, next) => {
  Person.findById(req.params.id)
    .then((person) => {
      if (person) {
        res.json(person.toJSON());
      } else {
        res.status(404).end();
      }
    })
    .catch((error) => next(error));
});

app.delete('/api/persons/:id', (req, res, next) => {
  Person.findByIdAndRemove(req.params.id)
    .then(() => {
      res.status(204).end();
    })
    .catch((error) => next(error));
});

app.put('/api/persons/:id', (req, res, next) => {
  const { body } = req;


  Person.findByIdAndUpdate(req.params.id, { number: body.number })
    .then((updatedPerson) => {
      res.json(updatedPerson.toJSON());
    })
    .catch((error) => next(error));
});


// eslint-disable-next-line consistent-return
app.post('/api/persons', (req, res, next) => {
  const { body } = req;

  if (body.name === undefined || body.number === undefined) {
    return res.status(400).json({
      error: 'content missing',
    });
  }
  const person = new Person({
    name: body.name,
    number: body.number,
  });

  person.save().then((newP) => newP.toJSON())
    .then((savedAndFP) => res.json(savedAndFP))
    .catch((error) => next(error));
});


const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};

app.use(unknownEndpoint);

// eslint-disable-next-line consistent-return
const errorHandler = (error, request, response, next) => {
  console.error(error.message);


  // eslint-disable-next-line eqeqeq
  if (error.name === 'CastError' && error.kind == 'ObjectId') {
    return response.status(400).send({ error: 'malformatted id' });
  } if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message });
  }

  next(error);
};

app.use(errorHandler);


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
