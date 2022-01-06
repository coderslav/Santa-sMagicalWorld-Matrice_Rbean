const { Sequelize, DataTypes } = require('sequelize');
const md5 = require('md5');

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
        },
    },
    {
        instanceMethods: {
            generateHash(password) {
                return md5(password);
            },
            validPassword(password) {
                let inputPass = md5(password);
                return this.password === inputPass;
            },
        },
    }
);

Toy.belongsTo(Category, { foreignKey: 'category', targetKey: 'name' });

module.exports = { db, Category, Toy, Elf };
