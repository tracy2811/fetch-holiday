import express, { Application, Response, Request, NextFunction} from 'express';
import graphqlHTTP from 'express-graphql';
import schema from './schema';

const app: Application = express();
const PORT: number = +process.env.PORT || 3000;

app.use('/graphql', graphqlHTTP({
	schema,
	graphiql: !(process.env.NODE_ENV === 'production'),
}));

app.get('/', (req: Request, res: Response, next: NextFunction) => res.redirect('/graphql'));

app.listen(PORT, () => console.log('Server running...'));

