const path = require("path");
const fs = require("fs");
const ignore = require("ignore");
const yargs = require('yargs');
const {hideBin} = require("yargs/helpers")
const readline = require('readline');
const chalk = require('chalk');
const prompt = require('prompt-sync')({
  sigint: false
});

//CONFIG VALUES
//These are the types of files to which a copyright notice will be added, along with the start and end symbols for comments
const supportedFileTypes = {
  ".js": ["//", ""],
  ".ts": ["//", ""],
  ".tsx": ["//", ""],
  ".jsx": ["//", ""],
  ".css": ["/*", "*/"],
  ".txt": ["#", ""],
  ".html": ["<!--", "-->"]
}

try{
//Introduction
  console.log(chalk.blue.bold("Welcome to the Copyright Notice Helper"))
  console.log(chalk.blue.bold("This tool adds a copyright notice to every supported file in a project."))
  console.log(chalk.blue.bold("It will also output a single file with all supported filetypes combined, and a list of unsupported files."))
  console.log();
  console.log();


  const currentDirectory = __dirname;
  const rootDirectory = prompt(chalk.greenBright(`Where is the project you would like to copyright? `) +  chalk.blueBright(`(${currentDirectory})`), currentDirectory);
  console.log(rootDirectory)
  const joinedFilePath = path.join(rootDirectory, ".output");
  let copyrightEndStatement = "END OF COPYRIGHT NOTICE"


//Record and output a list of filetypes that were encountered, but not supported
  const unsupportedFiles = {};
  const supportedFiles = {};

//Get the copyright notice
  let copyrightNotice
  try{
    copyrightNotice = fs.readFileSync(path.join(rootDirectory, ".copyright")).toString();
  } catch (e){
    console.log(chalk.redBright("ERROR: Could not find .copyright file in root directory. Please create this file and try again."))
    closeProgram();
  }

//Create an empty file for the joined output.
  fs.writeFileSync(joinedFilePath, `Combined Output for ${rootDirectory}`);

  consumeFolder(rootDirectory, joinedFilePath, "", [], copyrightNotice, copyrightEndStatement, supportedFileTypes, supportedFiles, unsupportedFiles);



//OUTPUT AT END
  console.log();
  console.log(chalk.greenBright("Results:"))
  console.log(chalk.greenBright("Supported Filetypes:"))
  Object.keys(supportedFiles)
    .forEach(key=>{
      console.log(chalk.blue.bold(key.padEnd(10)), ": ", chalk.red(supportedFiles[key]))
    });


  console.log();
  console.log(chalk.greenBright("Unsupported Filetypes:"))
  Object.keys(unsupportedFiles)
    .forEach(key=>{
      console.log(chalk.blue.bold(key.padEnd(10)), ": ", chalk.red(unsupportedFiles[key]))
    });

  console.log();
  console.log(chalk.greenBright("Joined files have been output to: "));
  console.log(chalk.blueBright(joinedFilePath));

  console.log();
  console.log();

  closeProgram();
} catch(e){
  console.log(chalk.red(e.stack))
  closeProgram();
}


//SUPPORT FUNCTIONS

function closeProgram(){
  prompt("(Press any key to exit)")
  process.exit();
}

function consumeFolder(rootDirectory, joinedFilePath, relativeFolderPath, gitignore, copyrightNotice, copyrightEndStatement, supportedFileTypes, supportedFiles, unsupportedFiles){
  try{
    const newIgnore = fs.readFileSync(path.join(rootDirectory, relativeFolderPath, '.gitignore')).toString().split('\r\n').filter(x=>x);
    gitignore = gitignore.concat(newIgnore);
  } catch(e){

  }

  const ig = ignore().add(gitignore);

  //Read all files and folders in a directory
  const filesAndFolders = fs
    .readdirSync(path.join(rootDirectory, relativeFolderPath), {withFileTypes: true})
    .filter(x=>!ig.ignores(path.join(relativeFolderPath, x.name || "")) && x.name !== '.git')


  //Filter files and folders using gitignore

  //Divide into folders, and files
  const files = filesAndFolders
    .filter(x=>x.isFile())
    .map(x=>x.name);

  const folders = filesAndFolders
    .filter(x=>x.isDirectory())
    .map(x=>x.name);

  //For each file, read contents into memory
  files
    .filter(fileName=> {
      //If file type isn't supported, log it.
      const filetype = path.extname(fileName);
      if(Object.keys(supportedFileTypes).indexOf(filetype) > -1){
        supportedFiles[filetype] = (supportedFiles[filetype] || 0)  + 1;
        return true;
      } else {
        unsupportedFiles[filetype] = (unsupportedFiles[filetype] || 0)  + 1;
        return false;
      }
    })
    .forEach(fileName=>{
      const fileContents = fs.readFileSync(path.join(rootDirectory, relativeFolderPath, fileName));
      const fileType = path.extname(fileName);

      const contentsWithoutCopyright = stripCopyrightNotice(fileContents, copyrightEndStatement);
      const scrubbedContents = scrubSensitiveData(contentsWithoutCopyright, fileType);
      const contentsWithNewCopyright = prependCopyrightNotice(contentsWithoutCopyright, copyrightNotice, copyrightEndStatement, fileType, supportedFileTypes)

      appendFileToBatch(joinedFilePath, path.join(relativeFolderPath, fileName), scrubbedContents);
      saveCopyrightedFile(path.join(rootDirectory, relativeFolderPath, fileName), contentsWithNewCopyright)
    })

  folders.forEach(folderName=>{
    consumeFolder(rootDirectory, joinedFilePath, path.join(relativeFolderPath, folderName), gitignore, copyrightNotice, copyrightEndStatement, supportedFileTypes, supportedFiles, unsupportedFiles)
  })
}

function saveCopyrightedFile(fileNameWithPath, text){
  fs.writeFileSync(fileNameWithPath, text);
}

function appendFileToBatch(joinedFilePath, fileNameWithPath, text){

  const allText = [
    "",
    "",
    "",
    "********************************************************",
    fileNameWithPath,
    "",
    text
  ].join('\r\n')

  fs.appendFileSync(joinedFilePath, allText)
}

function stripCopyrightNotice(text, copyrightEndStatement){
  const startOfCopyrightNotice = text.indexOf(copyrightEndStatement);

  if(startOfCopyrightNotice === -1) return text;

  const withCopyrightRemoved = text.slice(startOfCopyrightNotice)
  return withCopyrightRemoved.slice(withCopyrightRemoved.indexOf('\n') + 1);
}

function prependCopyrightNotice(text, copyrightNotice, copyrightEndStatement, fileType, supportedFileTypes){

  //Add text at beginning, with commenting depending on filetype
  const commentSymbol = supportedFileTypes[fileType] || ["", ""];

  const commentedCopyrightNotice = copyrightNotice
    .split('\r\n')
    .concat(copyrightEndStatement)
    .map(line=>`${commentSymbol[0] || ""} ${line} ${commentSymbol[1] || ""}`.trim())
    .join('\r\n')

  return [commentedCopyrightNotice, text].join('\r\n')
}

function scrubSensitiveData(text, fileType){
  return text;
}

