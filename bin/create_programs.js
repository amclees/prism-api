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
let toComplete = 1;

async function loadCSV(callback) {
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

function createCollege(collegeData) {
  let collegeId = 0;
  College.find({name: collegeData.name}).remove((err) => {
      const college = new College(collegeData);
      college.save((err, savedCollege) => {
        collegeId = savedCollege._id;
      });
  });
  return new Promise(resolve => {
      resolve(collegeId);
  });
}

function createDepartment(departmentData) {
  let departmentId = 0;
  Department.find({name: departmentData.name}).remove((err) => {
      const department = new Department(departmentData);
      department.save((err, savedDepartment) => {
        departmentId = savedDepartment._id;
      });
  });
  return new Promise(resolve => {
      resolve(departmentId);
  });
}

async function createProgram(programData) {
  Program.find({name: programData.name}).remove((err) => {
      const program = new Program(programData);
      program.save((err, savedProgram) => {
        completed += 1;
      });
  });
}

function applyImport(entries) {
  for (let entry of entries) {
    // Check if college exists
    College.findOne({name: entry.college}, 'id', (err, foundCollege) => {
      if(foundCollege) {
        // Check if department exists
        Department.findOne({name: entry.department}, '_id', (err, foundDepartment) => {
          if(foundDepartment) {
            createProgram({
              name: entry.program,
              department: foundDepartment._id
            });
          } else {
            createDepartment({
              name: entry.department,
              abbreviation: entry.departmentAbbreviation,
              college: foundCollege._id
            }).then(function(departmentId) {
              createProgram({
                name: entry.program,
                department: departmentId
              });
            });
          }
        });
      } else {
        createCollege({
          name: entry.college,
          abbreviation: entry.collegeAbbreviation
        }).then(function(collegeId) {
          createDepartment({
            name: entry.department,
            abbreviation: entry.departmentAbbreviation,
            college: collegeId
          });
        }).then(function(departmentId) {
          createProgram({
            name: entry.program,
            department: departmentId
          });
        });
      }
    });
  }
}

function clearDB() {
  Program.find().remove();
  Department.find().remove();
  College.find().remove();
}

clearDB();
loadCSV(applyImport);

setInterval(() => {
  if (completed === toComplete) {
    console.log('Successfully added colleges, departments, and programs');
    process.exit(0);
  }
}, 100);
