const { Toy, Category, Elf } = require('./models');
const md5 = require('md5');

let express = require('express');

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
    return string.charAt(0).toUpperCase() + string.slice(1);
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
                        res.json(error);
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
                            res.json(error);
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
            await selectedToy.destroy();
            res.json(selectedToy);
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
                        res.json(error);
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
        res.json(selectedElves);
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
                    res.send(error.name);
                    return;
            }
        }
    });

app.route('/elves/:id')
    .get(async function (req, res) {
        let selectedElf = await Elf.findByPk(req.params.id);
        if (selectedElf) {
            res.json(selectedElf);
        } else {
            res.sendStatus(404);
        }
    })
    .put(async function (req, res) {
        let selectedElf = await Elf.findByPk(req.params.id);
        if (selectedElf) {
            if (req.body['first name']) {
                selectedElf.update({ 'first name': req.body['first name'] });
            }
            if (req.body['last name']) {
                selectedElf.update({ 'last name': req.body['last name'] });
            }
            if (req.body.login) {
                selectedElf.update({ login: req.body.login });
            }
            if (req.body.password) {
                selectedElf.update(generateHash(req.body.password));
            }
            res.json(selectedElf);
        } else {
            res.sendStatus(404);
        }
    })
    .delete(async function (req, res) {
        let selectedElf = await Elf.findByPk(req.params.id);
        if (selectedElf) {
            selectedElf.destroy();
            res.json(selectedElf);
        } else {
            res.sendStatus(404);
        }
    });

app.use(function (req, res, next) {
    res.sendStatus(404);
});

app.listen(port, () => {});
