const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin')


const app = express();
app.use(cors());
app.use(bodyParser.json());

require('dotenv').config();


const serviceAccount = require("./configs/burj-al-arab-wreet-firebase-adminsdk-hko39-5298a236a4.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),

});

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.enmmk.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookings = client.db("burjAlArab").collection("bookings");
    // perform actions on the collection object
    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    if (tokenEmail === req.query.email) {
                        bookings.find({ email: req.query.email })
                            .toArray((err, documents) => {
                                res.send(documents)
                            })
                    } else {
                        res.status(401).send('Unauthorized access');
                    }
                    // ...
                })
                .catch((error) => {
                    res.status(401).send('Unauthorized access');
                });
        } else {
            res.status(401).send('Unauthorized access');
        }



    })
});


app.get('/', (req, res) => {
    res.send('Hello from backend')
})

app.listen(4000)