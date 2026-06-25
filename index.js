require("dotenv").config();
const morgan = require("morgan");
const express = require("express");
const Person = require("./models/person");
const app = express();

app.use(express.json());
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body"),
);
app.use(express.static("dist"));

morgan.token("body", (req) => JSON.stringify(req.body));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/api/persons", (req, res) => {
  Person.find({}).then((persons) => {
    res.json(persons);
  });
});

app.get("/info", async (req, res) => {
  const date = new Date();
  const persons = await Person.find({});
  const length = persons.length;
  res.send(`<p>Phonebook has info for ${length} people</p><p>${date}</p>`);
});

app.get("/api/persons/:id", async (req, res) => {
  const id = req.params.id;

  const personFind = await Person.find({ id });
  if (!personFind) {
    return res.status(404).end();
  }

  res.json(personFind);
});

app.delete("/api/persons/:id", (req, res, next) => {
  const id = req.params.id;
  console.log(id);

  Person.findByIdAndDelete(id)
    .then((result) => {
      res.status(204).end();
    })
    .catch((error) => next(error));
});

app.post("/api/persons", (req, res, next) => {
  const body = req.body;

  if (!body.name) {
    return res.status(400).json({ error: "name missing" });
  }

  if (!body.number) {
    return res.status(400).json({ error: "number missing" });
  }

  const personToSave = new Person({
    name: body.name,
    number: body.number,
  });

  personToSave
    .save()
    .then((personSaved) => {
      res.json(personSaved);
    })
    .catch((error) => next(error));
});

app.put("/api/persons/:id", (req, res, next) => {
  const body = req.body;

  if (!body.name) {
    return res.status(400).json({ error: "name missing" });
  }

  if (!body.number) {
    return res.status(400).json({ error: "number missing" });
  }

  Person.findById(req.params.id).then((person) => {
    if (!person) {
      return res.status(404).end();
    }

    person.name = body.name;
    person.number = body.number;
    return person
      .save()
      .then((updatedPerson) => {
        res.json(updatedPerson);
      })
      .catch((error) => next(erro));
  });
});

const errorHandler = (error, request, response, next) => {
  console.error(error.message || error);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).send({ error: error.message });
  }
  next(error);
};

app.use(errorHandler);

const unknownEndpoint = (request, resposne) => {
  resposne.status(404).send({ error: "unknown endpoint" });
};

app.use(unknownEndpoint);
