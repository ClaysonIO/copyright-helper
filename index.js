const path = require("path");


const rootDirectory = "";
const joinedFilePath = ""
let gitignore = [];
let copyRightNotice = "";
let copyrightEndStatement = "END OF COPYRIGHT NOTICE"
const supportedFileTypes = ["txt", "html", "js", "css", "ts"]


function Initialize(rootDirectory){
  //copyright notice and initial gitignore
}

function consumeFolder(rootDirectory, joinedFilePath, relativeFolderPath, gitignore, copyrightNotice, copyrightEndStatement, supportedFileTypes){

  //Read all files and folders in a directory

  //Filter files and folders using gitignore

  //Divide into folders, and files
  const files = [];
  const folders = [];

  //For each file, read contents into memory
  files.forEach(file=>{
    const fileName = "";
    const fileContents = "";
    const fileType = "";

    //Only parse supported file types
    if(supportedFileTypes.indexOf(fileType) === -1) return;


    const contentsWithoutCopyright = stripCopyrightNotice(fileContents, copyrightEndStatement);
    const scrubbedContents = scrubSensitiveData(fileContents, fileType);
    const contentsWithNewCopyright = prependCopyrightNotice(contentsWithoutCopyright, copyrightNotice, copyrightEndStatement, fileType)

    appendFileToBatch(joinedFilePath, path.join(rootDirectory, relativeFolderPath, fileName), scrubbedContents);
    //Append text to



  })
}

function appendFileToBatch(joinedFilePath, fileNameWithPath, text){

  const allText = [
    "",
    "",
    filePath,
    fileName,
    "",
    text
  ].join('\n')

}

function stripCopyrightNotice(text, copyrightEndStatement){
const startOfCopyrightNotice = text.indexOf(copyrightEndStatement);

if(startOfCopyrightNotice === -1) return text;

const withCopyrightRemoved = text.slice(startOfCopyrightNotice)
  return withCopyrightRemoved.slice(withCopyrightRemoved.indexOf('\n') + 1);
}

function prependCopyrightNotice(text, copyrightNotice, copyrightEndStatement, fileType){
  //Comments are added to each line, using the following list.
  const commentSymbols = {
    js: ["//"],
    ts: ["//"],
    txt: ["#"],
    html: ["<!--", "-->"]
  }


  //Add text at beginning, with commenting depending on filetype
  const commentSymbol = commentSymbols[fileType] || ["", ""];

  const commentedCopyrightNotice = copyrightNotice
    .split('\n')
    .map(line=>`${commentSymbol[0] || ""} ${line} ${commentSymbol[1] || ""}`.trim())
    .join('\n')

  return [commentedCopyrightNotice, text].join('\n')
}

function scrubSensitiveData(text, fileType){
  return text;
}

