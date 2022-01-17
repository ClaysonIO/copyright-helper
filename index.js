const path = require("path");
const fs = require("fs");
const ignore = require("ignore");


const rootDirectory = "D:\\GitHub\\copyright-test";
const joinedFilePath = "D:\\GitHub\\copyright-helper\\joinedFile.txt";
let copyrightEndStatement = "END OF COPYRIGHT NOTICE"
const supportedFileTypes = {
  ".js": ["//"],
  ".ts": ["//"],
  ".txt": ["#"],
  ".html": ["<!--", "-->"]
}

const copyrightNotice = Initialize(rootDirectory);

fs.writeFileSync(joinedFilePath, "");

consumeFolder(rootDirectory, joinedFilePath, "", [], copyrightNotice, copyrightEndStatement, supportedFileTypes);

function Initialize(rootDirectory){
  //copyright notice and initial gitignore
  const copyrightFile = fs.readFileSync(path.join(rootDirectory, ".copyright")).toString();

  return copyrightFile;
}



function consumeFolder(rootDirectory, joinedFilePath, relativeFolderPath, gitignore, copyrightNotice, copyrightEndStatement, supportedFileTypes){
  try{
    const newIgnore = fs.readFileSync(path.join(rootDirectory, relativeFolderPath, '.gitignore')).toString().split('\r\n').filter(x=>x);
    gitignore = gitignore.concat(newIgnore);
  } catch(e){

  }

  const ig = ignore().add(gitignore);

  //Read all files and folders in a directory
  const filesAndFolders = fs
    .readdirSync(path.join(rootDirectory, relativeFolderPath), {withFileTypes: true})
    .filter(x=>!ig.ignores(path.join(relativeFolderPath, x.name)) && x.name !== '.git')


  //Filter files and folders using gitignore

  //Divide into folders, and files
  const files = filesAndFolders
    .filter(x=>x.isFile())
    .map(x=>x.name);

  const folders = filesAndFolders
    .filter(x=>x.isDirectory())
    .map(x=>x.name);

  console.log(files)

  //For each file, read contents into memory
  files
    .filter(fileName=> Object.keys(supportedFileTypes).indexOf(path.extname(fileName)) > -1)
    .forEach(fileName=>{
      const fileContents = fs.readFileSync(path.join(rootDirectory, relativeFolderPath, fileName));
      const fileType = path.extname(fileName);

      const contentsWithoutCopyright = stripCopyrightNotice(fileContents, copyrightEndStatement);
      const scrubbedContents = scrubSensitiveData(contentsWithoutCopyright, fileType);
      const contentsWithNewCopyright = prependCopyrightNotice(contentsWithoutCopyright, copyrightNotice, copyrightEndStatement, fileType, supportedFileTypes)

      appendFileToBatch(joinedFilePath, path.join(rootDirectory, relativeFolderPath, fileName), scrubbedContents);
      saveCopyrightedFile(path.join(rootDirectory, relativeFolderPath, fileName), contentsWithNewCopyright)
    })

  folders.forEach(folderName=>{
    consumeFolder(rootDirectory, joinedFilePath, path.join(relativeFolderPath, folderName), gitignore, copyrightNotice, copyrightEndStatement, supportedFileTypes)
  })
}

function saveCopyrightedFile(fileNameWithPath, text){
  fs.writeFileSync(fileNameWithPath, text);
}

function appendFileToBatch(joinedFilePath, fileNameWithPath, text){

  const allText = [
    "",
    "",
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
    .split('\n')
    .concat(copyrightEndStatement)
    .map(line=>`${commentSymbol[0] || ""} ${line} ${commentSymbol[1] || ""}`.trim())
    .join('\r\n')

  return [commentedCopyrightNotice, text].join('\r\n')
}

function scrubSensitiveData(text, fileType){
  return text;
}

