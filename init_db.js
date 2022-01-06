const { Toy, Category, Elf, Wish } = require('./models');

const migrate = async () => {
    await Category.sync();
    await Toy.sync();
    await Elf.sync();
    await Wish.sync();
};

migrate();
