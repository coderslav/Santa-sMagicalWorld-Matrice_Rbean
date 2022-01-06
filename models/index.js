const { Sequelize, DataTypes } = require('sequelize');
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

Toy.belongsTo(Category, { foreignKey: 'category', targetKey: 'name' });

module.exports = { db, Category, Toy };
