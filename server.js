const express = require(`express`);
const app = express();
const nunjucks = require(`nunjucks`);
const bodyParser = require(`body-parser`);
const mongoDB = require(`mongodb-legacy`);
const mongoClient = mongoDB.MongoClient;
const HOST = `localhost`;
const dbPort = `27017`;
const dbURL = `mongodb://${HOST}`;
const dbName = `project`;
const dbCollection = `users`;
const PORT = 3000;
const port = (process.env.PORT || PORT);
const colors = {
    reset: `\x1b[0m`,
    red: `\x1b[31m`,
    green: `\x1b[32m`,
    yellow: `\x1b[33m`,
};

let db;

/*
 * Configure the “views” folder to work with Nunjucks
 */
nunjucks.configure(`views`, {
    express: app,
    autoescape: true
});

/*
 * Configure the Node MongoDB client to connect to Mongo
 */
mongoClient.connect(`${dbURL}:${dbPort}`, (err, client) => {
    if (err) {
        return console.log(err);
    } else {
        db = client.db(dbName);

        console.log(`MongoDB successfully connected:`);
        console.log(`\tMongo URL:`, colors.green, dbURL, colors.reset);
        console.log(`\tMongo port:`, colors.green, dbPort, colors.reset);
        console.log(`\tMongo database name:`,
            colors.green, dbName, colors.reset, `\n`);
    }
});

/*
 * Configure Node to act as a web server
 */
app.listen(port, HOST, () => {
    console.log(`Host successfully connected:`);
    console.log(`\tServer URL:`, colors.green, `localhost`, colors.reset);
    console.log(`\tServer port:`, colors.green, port, colors.reset);
    console.log(`\tVisit http://localhost:${port}\n`);
});

/*
 * Express’s way of setting a variable for Nunjucks
 */
app.set(`view engine`, `njk`);

/*
 * Middleware
 */
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(`public`));

/*
 * GET: Home
 */
app.get(`/`, (req, res) => {
    console.log(`User requested root of web site.`);
    console.log(`Responding with index.njk via GET.`);

    res.render(`index.njk`);
});

/*
 * GET: Read all DB records
 */
app.get(`/read-a-db-record`, (req, res) => {
    db.collection(dbCollection).find().toArray((err, arrayObject) => {
        if (err) {
            return console.log(err);
        } else {
            console.log(`User requested /read-a-db-record.`);
            console.log(`Responding with read-from-database.njk via GET.\n`);

            res.render(`read-from-database.njk`, {mongoDBArray: arrayObject});
        }
    });
});

/*
 * GET: Create form
 */
app.get(`/create-a-db-record`, (req, res) => {
    res.render(`create-a-record-in-database.njk`);
});

/*
 * POST: Create a DB record
 */
app.post(`/create-a-db-record`, (req, res) => {
    db.collection(dbCollection).insertOne(req.body, (err) => {
        console.log(req.body);

        if (err) {
            return console.log(err);
        } else {
            console.log(`Inserted one record into Mongo via POST.\n`);
            res.redirect(`/read-a-db-record`);
        }
    });
});

/*
 * GET: Update form
 */
app.get(`/update-a-db-record`, (req, res) => {
    db.collection(dbCollection).find().toArray((err, arrayObject) => {
        if (err) {
            return console.log(err);
        } else {
            console.log(`User requested /update-a-db-record`);

            res.render(`update-a-record-in-database.njk`,
                {mongoDBArray: arrayObject});
        }
    });
});

/*
 * GET: Delete form
 */
app.get(`/delete-a-db-record`, (req, res) => {
    db.collection(dbCollection).find().toArray((err, arrayObject) => {
        res.render(`delete-a-record-in-database.njk`,
            {mongoDBArray: arrayObject});
    });
});


function logResult(action, name, result) {
    if (!result.value) {
        console.log(`${action} request did not match any record.`);
        console.log(`User name: ${name}\n`);
    } else {
        console.log(`${action} one record in Mongo through an HTML form using POST.`);
        console.log(`${action}d record:`, result.value, `\n`);
    }
}

/*
 * POST: Update a DB record
 */
app.post(`/update-a-db-record`, (req, res) => {
    const { name, password } = req.body;

    db.collection(dbCollection).findOneAndUpdate(
        { name },
        { $set: { password } },
        { returnDocument: `after` },
        (err, result) => {
            console.log(req.body);
            if (err) return console.log(err);

            logResult("Update", name, result);
            res.redirect(`/read-a-db-record`);
        }
    );
});

/*
 * POST: Delete a DB record
 */
app.post(`/delete-a-db-record`, (req, res) => {
    const { name } = req.body;

    db.collection(dbCollection).findOneAndDelete(
        { name },
        (err, result) => {
            console.log(req.body);
            if (err) return console.log(err);

            logResult("Delete", name, result);
            res.redirect(`/read-a-db-record`);
        }
    );
});

