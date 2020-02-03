const express = require('express');
const graphqlHTTP = require('express-graphql');
const schema = require('./schema');

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/graphql', graphqlHTTP({
	schema,
	graphiql: !(process.env.NODE_ENV === 'production'),
}));

app.listen(PORT, () => console.log(`Server running on ${PORT}`));

