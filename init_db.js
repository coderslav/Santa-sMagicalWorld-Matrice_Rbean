const { Toy, Category, Elf } = require('./models');

const migrate = async () => {
    await Category.sync();
    await Toy.sync();
    await Elf.sync();
};

migrate();
