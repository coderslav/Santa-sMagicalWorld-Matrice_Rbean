const { Toy, Category } = require('./models');
let express = require('express');
let app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

function handleStringsToNumber(price, category_id) {
    if (typeof price === 'string') {
        price = parseFloat(price);
        if (isNaN(price)) {
            return false;
        }
    }
    if (typeof category_id === 'string') {
        if (category_id === 'null') {
            category_id = null;
        } else {
            category_id = parseInt(category_id);
            if (isNaN(category_id)) {
                return false;
            }
        }
    }
    return true;
}

app.all('/toys', async function (req, res) {
    if (req.method === 'GET') {
        res.json(await Toy.findAll());
    } else if (req.method === 'POST') {
        if (Object.keys(req.body).length >= 2 && ['name', 'price'].every((el) => Object.keys(req.body).includes(el)) && handleStringsToNumber(req.body.price, req.body.category_id)) {
            let sameToyCheck = await Toy.findOne({ where: req.body });
            if (sameToyCheck) {
                res.status(501).send(`Sorry, but the same toy already exists in the database: ${JSON.stringify(sameToyCheck)}`);
                return;
            }
            try {
                res.json(await Toy.create({ name: req.body.name, description: req.body.description ? req.body.description : null, price: req.body.price, category_id: req.body.category_id ? req.body.category_id : null }));
            } catch (error) {
                switch (error.name) {
                    case 'SequelizeForeignKeyConstraintError':
                        res.status(501).send(`Key (category_id)=(${req.body.category_id}) is not present in table "categories".`);
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
            if (req.body.price || req.body.category_id) {
                if (handleStringsToNumber(req.body.price, req.body.category_id)) {
                    if (req.body.category_id || req.body.category_id === null) {
                        try {
                            await selectedToy.update({ category_id: req.body.category_id });
                        } catch (error) {
                            switch (error.name) {
                                case 'SequelizeForeignKeyConstraintError':
                                    res.status(501).send(`Key (category_id)=(${req.body.category_id}) is not present in table "categories".`);
                                    return;
                                default:
                                    res.json(error);
                                    return;
                            }
                        }
                    }
                    if (req.body.price) {
                        await selectedToy.update({ price: req.body.price });
                    }
                } else {
                    res.sendStatus(422);
                    return;
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

app.all('/categories', async function (req, res) {
    if (req.method === 'GET') {
        res.json(await Category.findAll());
    } else if (req.method === 'POST') {
        if (Object.keys(req.body).length === 1 && Object.keys(req.body).includes('name')) {
            let sameCategoryCheck = await Category.findOne({ where: req.body });
            if (sameCategoryCheck) {
                res.status(501).send(`Sorry, but the same category already exists in the database: ${JSON.stringify(sameCategoryCheck)}`);
                return;
            }
            res.json(await Category.create({ name: req.body.name }));
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
    let selectedCategories = await Category.findAll();
    let categoryObjectID;
    if (
        selectedCategories.some((el) => {
            if (el.name.toLocaleLowerCase() === req.params.name.toLocaleLowerCase()) {
                categoryObjectID = el.id;
                return true;
            }
        })
    ) {
        let selectedToys = await Toy.findAll();
        if (req.method === 'GET') {
            let resultArray = [];
            selectedToys.map((el) => {
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
