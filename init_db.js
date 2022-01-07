const { Toy, Category, Elf, Wish, Schedule } = require('./models');

const migrate = async () => {
    await Category.sync();
    await Toy.sync();
    await Elf.sync();
    await Wish.sync();
    await Schedule.sync();
};

migrate();
