const { Toy, Category } = require('./models');
let express = require('express');
let app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

function handleStringsToNumber(body) {
    if (typeof body.price === 'string') {
        body.price = parseFloat(body.price);
    }
    if (typeof body.category_id === 'string') {
        if (body.category_id === 'null') {
            body.category_id = null;
        } else {
            body.category_id = parseInt(body.category_id);
        }
    }
}

app.all('/toys', async function (req, res) {
    if (req.method === 'GET') {
        res.json(await Toy.findAll());
    } else if (req.method === 'POST') {
        if (Object.keys(req.body).length === 4 && ['name', 'description', 'price', 'category_id'].every((el) => Object.keys(req.body).includes(el))) {
            handleStringsToNumber(req.body);
            toys = [...toys, req.body];
            res.json(toys.slice(-1)[0]);
        } else {
            res.sendStatus(422);
        }
    } else {
        res.sendStatus(404);
    }
});
app.all('/toys/:id', async function (req, res) {
    if (req.params.id >= 1 && req.params.id <= (await Toy.findAll()).length) {
        if (req.method === 'GET') {
            res.json(await Toy.findByPk(req.params.id));
        } else if (req.method === 'PUT') {
            if (req.body.category_id || req.body.price) {
                handleStringsToNumber(req.body);
                if (req.body.category_id || req.body.category_id === null) {
                    toys[req.params.id].category_id = req.body.category_id;
                }
                if (req.body.price) {
                    toys[req.params.id].price = req.body.price;
                }
            }
            if (req.body.name) {
                toys[req.params.id].name = req.body.name;
            }
            if (req.body.description) {
                toys[req.params.id].description = req.body.description;
            }
            res.json(toys[req.params.id]);
        } else if (req.method === 'DELETE') {
            let deletedObjectsArray = toys.splice(req.params.id, 1);
            res.json(deletedObjectsArray[0]);
        } else {
            res.sendStatus(404);
        }
    } else {
        res.sendStatus(404);
    }
});

app.all('/categories', async function (req, res) {
    if (req.method === 'GET') {
        res.json(await Category.findAll());
    } else if (req.method === 'POST') {
        if (Object.keys(req.body).length === 1 && Object.keys(req.body).includes('name')) {
            handleStringsToNumber(req.body);
            categories = [...categories, req.body];
            res.json(categories.slice(-1)[0]);
        } else {
            res.sendStatus(422);
        }
    } else {
        res.sendStatus(404);
    }
});
app.all('/categories/:id', async function (req, res) {
    if (req.params.id >= 1 && req.params.id <= (await Category.findAll()).length) {
        if (req.method === 'GET') {
            res.json(await Category.findByPk(req.params.id));
        } else if (req.method === 'PUT') {
            if (req.body.name) {
                categories[req.params.id].name = req.body.name;
            }
            res.json(categories[req.params.id]);
        } else if (req.method === 'DELETE') {
            let deletedObjectsArray = categories.splice(req.params.id, 1);
            res.json(deletedObjectsArray[0]);
        } else {
            res.sendStatus(404);
        }
    } else {
        res.sendStatus(404);
    }
});
app.all('/categories/:name/toys', async function (req, res) {
    let categoryObjectID;
    if (
        (await Category.findAll()).some((el) => {
            if (el.name.toLocaleLowerCase() === req.params.name.toLocaleLowerCase()) {
                categoryObjectID = el.id;
                return true;
            }
        })
    ) {
        if (req.method === 'GET') {
            let resultArray = [];
            (await Toy.findAll()).map((el) => {
                if (el.category_id === categoryObjectID) {
                    resultArray.push(el);
                }
            });
            res.json(resultArray);
        } else {
            res.sendStatus(404);
        }
    } else {
        res.sendStatus(404);
    }
});

app.use(function (req, res, next) {
    res.sendStatus(404);
});

app.listen(port, () => {});
