require('dotenv').config()
const express = require('express');
const app = express();
const morgan = require('morgan');
const { default: helmet } = require('helmet');
const compression = require('compression');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { buildOpenApiSpec } = require('./configs/api-docs');


// Middleware 
app.use(cors());
app.use(morgan('combined')) // notification when api is called
app.use(helmet()) //hide tech
app.use(compression()) //use less bandwidth
app.use('/api/payments/sepay/webhook', express.raw({ type: '*/*' }))
app.use(express.json()) // parse json request
app.use(express.urlencoded({ extended: true })) // parse urlencoded request

// Database
require('./databases/init.mongodb')

const swaggerDocument = buildOpenApiSpec();

// API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    explorer: true,
    swaggerOptions: {
        docExpansion: 'none',
    },
}))
app.get('/api-docs.json', (req, res) => {
    res.json(swaggerDocument)
})


//Routes
app.use('', require('./routes/index'))

//             Handle Error
app.use((req, res, next) => {
    const error = new Error('Not Found Your URL')
    error.status = 404
    next(error)
})

app.use((error, req, res, next) => {
    const statusCode = error.status || error.statusCode || 500
    return res.status(statusCode).json({
        code: statusCode,
        message: error.message || 'Internal Server Error',
        metadata: null,
    })
})
module.exports = app;