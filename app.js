const { Toy, Category, Elf, Wish, Schedule } = require('./models');
const crypto = require('crypto');

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
    return typeof string === 'string' ? string.charAt(0).toUpperCase() + string.slice(1) : null;
}
function generateHash(password) {
    return crypto.createHash('md5').update(password).digest('hex');
}
async function randomElf() {
    let allElves;
    try {
        allElves = await Elf.findAll();
    } catch (error) {
        return error.name;
    }
    let elvesIdList = [];
    for (let index = 0; index < allElves.length; index++) {
        elvesIdList.push(allElves[index].id);
    }
    for (let i = elvesIdList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * i);
        const temp = elvesIdList[i];
        elvesIdList[i] = elvesIdList[j];
        elvesIdList[j] = temp;
    }
    return elvesIdList[1];
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
                        res.status(422).json(`Name "${req.body.category}" is not present in table "categories"!`);
                        return;
                    case 'SequelizeUniqueConstraintError':
                        res.status(422).json('A toy with a similar name is already exists!');
                        return;
                    default:
                        res.status(422).json(error.name);
                        return;
                }
            }
        } else {
            res.status(422).json('Invalid data entered! Please note that the "name" and "price" of new Toy are required data.');
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
                    res.status(422).json('Value of the "price" is incorrect!');
                    return;
                }
            }
            if (req.body.category) {
                try {
                    await selectedToy.update({ category: req.body.category });
                } catch (error) {
                    switch (error.name) {
                        case 'SequelizeForeignKeyConstraintError':
                            res.status(422).json(`Name "${req.body.category}" is not present in table "categories"!`);
                            return;
                        default:
                            res.status(422).json(error.name);
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
                        res.status(422).json('Delete ERROR! This toy is still referenced from table "wishes". Children are waiting for their toys!');
                        return;
                    default:
                        res.status(422).json(error.name);
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
            res.status(422).json('Invalid data entered! Please note that the "name" of new Category is required data.');
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
                        res.status(422).json(`You can't delete this category! "${selectedCategory.name}" is still referenced from table "toys"`);
                        return;
                    default:
                        res.status(422).json(error.name);
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
            switch (error.name) {
                case 'SequelizeValidationError':
                    res.status(422).json('Please enter all the required data to create a new Elf: "first name", "last name", "login", "password"!');
                    return;
                case 'SequelizeDatabaseError':
                    res.status(422).json("You can't create a new Elf with this data! Please check again your input.");
                    return;
                default:
                    res.status(422).json(error.name);
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
                await req.body.selectedElf.update({ 'first name': req.body['first name'] });
            }
            if (req.body['last name']) {
                await req.body.selectedElf.update({ 'last name': req.body['last name'] });
            }
            if (req.body.login) {
                await req.body.selectedElf.update({ login: req.body.login });
            }
            if (req.body.password) {
                await req.body.selectedElf.update(generateHash(req.body.password));
            }
            res.json(req.body.selectedElf);
        } else {
            res.sendStatus(404);
        }
    })
    .delete(async function (req, res) {
        if (req.body.selectedElf) {
            await req.body.selectedElf.destroy();
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
            let createdWish = await Wish.findOrCreate({ where: { 'child name': req.body['child name'], toy_id: selectedToy.id } });
            let randomElfId = await randomElf();
            if (isNaN(randomElfId)) {
                res.status(503).json("Sorry, I haven't available elves for deliver your wish :( Please, try again later!");
                return;
            }
            if (!(await Schedule.findOne({ where: { wish_id: createdWish[0].id } }))) await Schedule.create({ wish_id: createdWish[0].id, elf_id: randomElfId });
            res.json(createdWish[0]);
        } else {
            res.status(404).json('Toy not found:(');
        }
    } else {
        res.status(404).json("Enter your name please, cute child! Otherwise I won't understand who to send the gift to.");
    }
});

// ++++++++++++++++++++++++++++++++++++++++++++ SCHEDULES ++++++++++++++++++++++++++++++++++++++++++++

app.get('/schedules', async function (req, res) {
    if (req.query.login && req.query.password) {
        let selectedElf = await Elf.findOne({ where: { login: req.query.login, password: generateHash(req.query.password) } });
        if (selectedElf) {
            let selectedSchedules = await Schedule.findAll({ where: { elf_id: selectedElf.id } });
            selectedSchedules.length > 0 ? selectedSchedules : res.json("You don't have missions yet. Check again later!");
        } else {
            res.status(404).json('The elf cannot be found! Wrong login or password.');
        }
    } else {
        res.status(422).json('Access DENIED! Enter login and password please.');
    }
});
app.put('/schedules/:id/done', async function (req, res) {
    let selectedSchedule = await Schedule.findOne({ where: { id: req.params.id } });
    if (selectedSchedule) {
        selectedSchedule.done ? res.json(selectedSchedule) : res.json(await selectedSchedule.update({ done: true, done_at: new Date() }));
    } else {
        res.sendStatus(404);
    }
});

app.use(function (req, res, next) {
    res.sendStatus(404);
});

app.listen(port, () => {});
