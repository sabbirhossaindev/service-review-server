const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { request, query } = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// meddle Ware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ok9cief.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// console.log(uri);

// verifyJWT................
function verifyJWT(req, res, next) {
    const authHeader = (req.headers.authorization);
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const serviceCollection = client.db('doctorServices').collection('services');
        const submitCollection = client.db('doctorServices').collection('review');

        // jwt
        app.post('/jwt', (req, res) => {
            const user = req.body;
            // console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' })
            res.send({token})
        })

        // limit for 3 services
        app.get('/limitsServices', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query).limit(3);
            const services = await cursor.toArray();
            res.send(services);
        });

        // all router paba...
        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            console.log('services', services);
            res.send(services);
        });


        //Get a single id
        app.get('/service/:id', async (req, res) => {
        const id = req.params.id;
        console.log('id ', id);
        const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            console.log('service', service);
        res.send(service);
        })

         
         app.get('/myReview', verifyJWT, async (req, res) => {
            
            const decoded = req.decoded;
            
            if(decoded.email !== req.query.email){
                res.status(403).send({message: 'unauthorized access'})
            }

            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }

            const cursor = submitCollection.find(query);
            const myReview = await cursor.toArray();
            res.send(myReview);
        });

        app.post('/services', async (req, res) => {
            const service = req.body;
            const result = await submitCollection.insertOne(service)
            res.send(result)
        });

        app.get('/myReview', async (req, res) => {
            const query = {}
            const cursor = submitCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        // update
        app.patch('/services/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const status = req.body.status
            const query = { _id: ObjectId(id) }
            const updatedDoc = {
                $set:{
                    status: status
                }
            }
            const result = await submitCollection.updateOne(query, updatedDoc);
            res.send(result);
        })

        // delete
        app.delete('/services/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await submitCollection.deleteOne(query);
            res.send(result);
        })
      
    }
    finally {
      
    }
  }
  run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('doctor services is running')
});

app.listen(port, () => {
    console.log(`doctor Servers Running on ${port}`);
});