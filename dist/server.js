"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_graphql_1 = __importDefault(require("express-graphql"));
const schema_1 = __importDefault(require("./schema"));
const app = express_1.default();
const PORT = process.env.PORT || 3000;
app.use('/graphql', express_graphql_1.default({
    schema: schema_1.default,
    graphiql: !(process.env.NODE_ENV === 'production'),
}));
app.get('/', (req, res, next) => res.redirect('/graphql'));
app.listen(PORT, () => console.log('Server running...'));
