'use strict';
require('dotenv').config();

const csv = require('csv');
const fs = require('fs');
const mongoose = require('mongoose');
mongoose.promise = Promise;
mongoose.connect(process.env.DB_HOST, {useMongoClient: true});

const College = require('../models/college.model');
const Department = require('../models/department.model');
const Program = require('../models/program.model');

let completed = 0;
let toComplete;

function loadCSV(callback) {
    fs.readFile('./bin/raw-programs.csv', 'utf-8', (error, data) => {
        if (error)
            return console.log(error);

        csv.parse(data, { columns: true }, (error, data) => {
            if (error)
                return console.log('There was an error parsing data!')
            toComplete = data.length;
            callback(data);
        });
    });
}

function createCollege(currentCollege, currentDepartment, currentProgram) {
  return new Promise((resolve, reject) => {
    const college = new College(currentCollege);
    college.save((err, savedCollege) => {
      if (!err) {
        currentDepartment.college = savedCollege._id;
        return createDepartment(currentDepartment, currentProgram).then(function() {
          resolve();
        }, err => {
          console.log(err);
          reject();
        });
      } else {
        console.log(err);
        reject();
      }
    });
  });
}

function createDepartment(currentDepartment, currentProgram) {
  return new Promise((resolve, reject) => {
    const department = new Department(currentDepartment);

    department.save((err, savedDepartment) => {

      if (!err) {
        currentProgram.department = savedDepartment._id;
        createProgram(currentProgram).then(function() {
          resolve();
        }, err => {
          console.log(err);
          reject();
        });
      } else {
        console.log(err);
        reject();
      }
    });
  });
}

function createProgram(currentProgram) {
  return new Promise((resolve, reject) => {
    const program = new Program(currentProgram);
    program.save((err, savedProgram) => {
      if(!err) {
        completed += 1;
        resolve();
      } else {
        console.log(err);
        reject();
      }
    });
  });
}

async function applyImport(entries) {
  for(let entry of entries) {
    await importEntry(entry);
  }
}

function importEntry(entry) {
  return new Promise ((resolve, reject) => {
    College.findOne({name: entry.college}, '_id', (err, foundCollege) => {
    if(foundCollege) {
      Department.findOne({name: entry.department}, '_id', (err, foundDepartment) => {
        if(foundDepartment) {
          createProgram({
            name: entry.program,
            department: foundDepartment._id,
            nextReviewDate: entry.nextReviewDate
          }).then(resolve, reject);;
        } else {
          createDepartment({name: entry.department, college: foundCollege._id, abbreviation: entry.departmentAbbreviation},
            {name: entry.program, nextReviewDate: entry.nextReviewDate }).then(resolve, reject);;
        }
      });
    } else {
      createCollege({name: entry.college, abbreviation: entry.collegeAbbreviation},
        {name: entry.department, abbreviation: entry.departmentAbbreviation},
        {name: entry.program, nextReviewDate: entry.nextReviewDate}).then(resolve, reject);
    }
  });
});
}

function removePrograms() {
  return new Promise ((resolve, reject) => {
    Program.find({}).remove(function (err) {
      if(!err) {
        resolve();
      }
      else {
        reject();
      }
    });
  });
}

function removeDepartments() {
  return new Promise ((resolve, reject) => {
    Department.find({}).remove(function (err) {
      if(!err) {
        resolve();
      }
      else {
        reject();
      }
    });
  });
}

function removeColleges() {
  return new Promise ((resolve, reject) => {
    College.find({}).remove(function (err) {
      if(!err) {
        resolve();
      }
      else {
        reject();
      }
    });
  });
}

removePrograms().then(function () {
  return removeDepartments();
}).then(function () {
  return removeColleges();
}).then(function () {
  loadCSV(applyImport);
});

setInterval(() => {
  if (completed === toComplete) {
    console.log('Successfully added colleges, departments, and programs');
    process.exit(0);
  }
}, 100);
