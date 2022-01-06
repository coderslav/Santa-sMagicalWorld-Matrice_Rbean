const { Toy, Category, Elf, Wish } = require('./models');
const md5 = require('md5');

let express = require('express');
const { RowDescriptionMessage } = require('pg-protocol/dist/messages');

let app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

function handleStringsToNumber(price) {
    if (typeof price === 'string') {
        price = parseFloat(price);
        if (isNaN(price)) {
            return false;
        }
    }
    return true;
}
function capitalize(string) {
    return typeof string === 'string' ? string.charAt(0).toUpperCase() + string.slice(1) : null;
}
function generateHash(password) {
    return md5(password);
}

// ++++++++++++++++++++++++++++++++++++++++++++ TOYS ++++++++++++++++++++++++++++++++++++++++++++

app.all('/toys', async function (req, res) {
    if (req.method === 'GET') {
        res.json(await Toy.findAll({ order: [['id', 'ASC']] }));
    } else if (req.method === 'POST') {
        if (Object.keys(req.body).length >= 2 && ['name', 'price'].every((el) => Object.keys(req.body).includes(el)) && handleStringsToNumber(req.body.price)) {
            try {
                res.json((await Toy.findOrCreate({ where: { name: req.body.name, description: req.body.description ? req.body.description : null, price: req.body.price, category: req.body.category ? capitalize(req.body.category) : null } }))[0]);
            } catch (error) {
                switch (error.name) {
                    case 'SequelizeForeignKeyConstraintError':
                        res.status(501).send(`Name "${req.body.category}" is not present in table "categories".`);
                        return;
                    default:
                        res.status(501).send(error.name);
                        return;
                }
            }
        } else {
            res.sendStatus(422);
        }
    } else {
        res.sendStatus(404);
    }
});
app.all('/toys/:id', async function (req, res) {
    let selectedToy = await Toy.findByPk(req.params.id);
    if (selectedToy) {
        if (req.method === 'GET') {
            res.json(selectedToy);
        } else if (req.method === 'PUT') {
            if (req.body.price) {
                if (handleStringsToNumber(req.body.price)) {
                    if (req.body.price) {
                        await selectedToy.update({ price: req.body.price });
                    }
                } else {
                    res.sendStatus(422);
                    return;
                }
            }
            if (req.body.category) {
                try {
                    await selectedToy.update({ category: req.body.category });
                } catch (error) {
                    switch (error.name) {
                        case 'SequelizeForeignKeyConstraintError':
                            res.status(501).send(`Name "${req.body.category}" is not present in table "categories".`);
                            return;
                        default:
                            res.status(501).send(error.name);
                            return;
                    }
                }
            }
            if (req.body.name) {
                await selectedToy.update({ name: req.body.name });
            }
            if (req.body.description) {
                await selectedToy.update({ description: req.body.description });
            }
            res.json(selectedToy);
        } else if (req.method === 'DELETE') {
            try {
                await selectedToy.destroy();
                res.json(selectedToy);
            } catch (error) {
                switch (error.name) {
                    case 'SequelizeForeignKeyConstraintError':
                        res.status(501).send('Delete ERROR. This toy is still referenced from table "wishes". Children are waiting for their toys!');
                        return;
                    default:
                        res.status(501).send(error.name);
                        return;
                }
            }
        } else {
            res.sendStatus(404);
        }
    } else {
        res.sendStatus(404);
    }
});

//+++++++++++++++++++++++++++++++++++++++++ CATEGORIES ++++++++++++++++++++++++++++++++++++++++++

app.all('/categories', async function (req, res) {
    if (req.method === 'GET') {
        res.json(await Category.findAll({ order: [['id', 'ASC']] }));
    } else if (req.method === 'POST') {
        if (Object.keys(req.body).length === 1 && Object.keys(req.body).includes('name')) {
            res.json((await Category.findOrCreate({ where: { name: req.body.name } }))[0]);
        } else {
            res.sendStatus(422);
        }
    } else {
        res.sendStatus(404);
    }
});
app.all('/categories/:id', async function (req, res) {
    let selectedCategory = await Category.findByPk(req.params.id);
    if (selectedCategory) {
        if (req.method === 'GET') {
            res.json(selectedCategory);
        } else if (req.method === 'PUT') {
            if (req.body.name) {
                res.json(await selectedCategory.update({ name: req.body.name }));
            }
        } else if (req.method === 'DELETE') {
            try {
                await selectedCategory.destroy();
                res.json(selectedCategory);
            } catch (error) {
                switch (error.name) {
                    case 'SequelizeForeignKeyConstraintError':
                        res.status(501).send(`You can't delete this category. "${selectedCategory.name}" is still referenced from table "toys".`);
                        return;
                    default:
                        res.status(501).send(error.name);
                        return;
                }
            }
        } else {
            res.sendStatus(404);
        }
    } else {
        res.sendStatus(404);
    }
});
app.all('/categories/:name/toys', async function (req, res) {
    let selectedToys = await Toy.findAll({ where: { category: capitalize(req.params.name) }, order: [['id', 'ASC']] });
    selectedToys.length > 0 ? res.json(selectedToys) : res.sendStatus(404);
});

//+++++++++++++++++++++++++++++++++++++++++++++++++ ELVES +++++++++++++++++++++++++++++++++++++++

app.route('/elves')
    .get(async function (req, res) {
        let selectedElves = await Elf.findAll();
        selectedElves ? res.json(selectedElves) : res.sendStatus(404);
    })
    .post(async function (req, res) {
        if (req.body.password) {
            req.body.password = generateHash(req.body.password);
        }
        try {
            res.json((await Elf.findOrCreate({ where: req.body }))[0]);
        } catch (error) {
            console.log(error.name);
            switch (error.name) {
                case 'SequelizeValidationError':
                    res.status(501).send('Please enter all the required data to create a new Elf: "first name", "last name", "login", "password".');
                    return;
                case 'SequelizeDatabaseError':
                    res.status(501).send("You can't create a new Elf with this data. Please check again your input.");
                    return;
                default:
                    res.status(501).send(error.name);
                    return;
            }
        }
    });
app.route('/elves/:id')
    .all(async function (req, res, next) {
        req.body.selectedElf = await Elf.findByPk(req.params.id);
        next();
    })
    .get(async function (req, res) {
        if (req.body.selectedElf) {
            res.json(req.body.selectedElf);
        } else {
            res.sendStatus(404);
        }
    })
    .put(async function (req, res) {
        if (req.body.selectedElf) {
            if (req.body['first name']) {
                req.body.selectedElf.update({ 'first name': req.body['first name'] });
            }
            if (req.body['last name']) {
                req.body.selectedElf.update({ 'last name': req.body['last name'] });
            }
            if (req.body.login) {
                req.body.selectedElf.update({ login: req.body.login });
            }
            if (req.body.password) {
                req.body.selectedElf.update(generateHash(req.body.password));
            }
            res.json(req.body.selectedElf);
        } else {
            res.sendStatus(404);
        }
    })
    .delete(async function (req, res) {
        if (req.body.selectedElf) {
            req.body.selectedElf.destroy();
            res.json(req.body.selectedElf);
        } else {
            res.sendStatus(404);
        }
    });

// ++++++++++++++++++++++++++++++++++++++++++++++++ WISHES ++++++++++++++++++++++++++++++++++++++++

app.get('/wishes/index', async function (req, res) {
    let selectedWishes = await Wish.findAll();
    selectedWishes ? res.json(selectedWishes) : res.sendStatus(404);
});
app.post('/wishes/create', async function (req, res) {
    if (req.body['child name']) {
        let selectedToy = await Toy.findOne({ where: { name: capitalize(req.body['toy name']) } });
        if (selectedToy) {
            res.json((await Wish.findOrCreate({ where: { 'child name': req.body['child name'], toy_id: selectedToy.id } }))[0]);
        } else {
            res.status(404).send('Toy not found:(');
        }
    } else {
        res.status(404).send("Enter your name please, cute child! Otherwise I won't understand who to send the gift to.");
    }
});

app.use(function (req, res, next) {
    res.sendStatus(404);
});

app.listen(port, () => {});
