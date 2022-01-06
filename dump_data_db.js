const { Toy, Category } = require('./models');
const { toys, categories } = require('./data.js');

function patchToysObject(toys, categories) {
    for (let index = 0; index < toys.length; index++) {
        if (toys[index].category_id || toys[index].category_id === 0) {
            toys[index].category = categories[toys[index].category_id].name;
        } else {
            toys[index].category = null;
        }
        delete toys[index].category_id;
    }
}
patchToysObject(toys, categories);

async function dump_stuff() {
    for (let i = 0; i < categories.length; i++) {
        let a_cat = Category.build(categories[i]);
        await a_cat.save();
        console.log('Category', a_cat.name, 'was saved successfully.');
    }
    for (let i = 0; i < toys.length; i++) {
        let toy = toys[i];
        let a_toy = Toy.build(toy);
        await a_toy.save();
        console.log('Toy', a_toy.name, 'was saved successfully.');
    }
}

dump_stuff();
