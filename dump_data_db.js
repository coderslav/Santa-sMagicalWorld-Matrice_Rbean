const { Toy, Category } = require('./models');
const { toys, categories } = require('./data.js');

async function dump_stuff() {
    for (let i = 0; i < categories.length; i++) {
        let a_cat = Category.build(categories[i]);
        await a_cat.save();
        console.log('Category', a_cat.name, 'was saved successfully.');
    }
    for (let i = 0; i < toys.length; i++) {
        let toy = toys[i];
        if (toy.category_id !== null) toy.category_id++; //augmente tout les ID de 1 car ils commencent Ã  0 dans le fichier data.js
        let a_toy = Toy.build(toy);
        await a_toy.save();
        console.log('Toy', a_toy.name, 'was saved successfully.');
    }
}

dump_stuff();
