import mongoose from 'mongoose';

const partnersSchema = new mongoose.Schema({
    name: String,
    origin: {
        string
    }[],
    accessPermission: {
        getBioPromoteCode: boolean,
        getJoy: boolean,
        getItemInHugoDecor: bolean,
    }

})