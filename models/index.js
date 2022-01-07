const { Sequelize, DataTypes } = require('sequelize');
const crypto = require('crypto');

const dbPass = 'newpass';

let db = new Sequelize('santa_world', 'postgres', dbPass, {
    host: 'localhost',
    dialect: 'postgres',
});

let Category = db.define(
    'Category',
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    },
    {
        timestamps: false,
        tableName: 'categories',
    }
);

let Toy = db.define(
    'Toy',
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
    },
    {
        timestamps: false,
        tableName: 'toys',
    }
);

let Elf = db.define(
    'Elf',
    {
        'first name': {
            type: DataTypes.STRING,
            allowNull: false,
        },
        'last name': {
            type: DataTypes.STRING,
            allowNull: false,
        },
        login: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        tableName: 'elves',
    }
);

let Wish = db.define(
    'Wish',
    {
        'child name': {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        tableName: 'wishes',
    }
);

let Schedule = db.define(
    'Schedule',
    {
        done: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        done_at: {
            type: DataTypes.DATE,
            defaultValue: null,
        },
    },
    {
        tableName: 'schedules',
    }
);

Toy.belongsTo(Category, { foreignKey: 'category', targetKey: 'name' });
Wish.belongsTo(Toy, { foreignKey: { name: 'toy_id', allowNull: false }, onDelete: 'NO ACTION' });
Schedule.belongsTo(Wish, { foreignKey: { name: 'wish_id', allowNull: false }, onDelete: 'NO ACTION' });
Schedule.belongsTo(Elf, { foreignKey: { name: 'elf_id', allowNull: false }, onDelete: 'NO ACTION' });

module.exports = { db, Category, Toy, Elf, Wish, Schedule };
