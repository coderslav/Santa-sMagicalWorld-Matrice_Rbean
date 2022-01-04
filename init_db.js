const { Toy, Category } = require('./models');

const migrate = async () => {
    await Category.sync();
    await Toy.sync();
};

migrate();
