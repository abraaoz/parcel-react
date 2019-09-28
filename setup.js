var shell = require('shelljs');
var slugify = require('slugify');
var isGitUrl = require('is-git-url');

var new_project_name = process.argv[2];
var new_project_slug = slugify(new_project_name, {lower: true});

var match = /^\#\ (.+)[\r\n]/.exec(shell.cat('README.md'))
if(match == null) {
  shell.echo('Could not determine project name from first line of README.md file');
  shell.exit(1);
}
var old_project_name = match[1];
var old_project_slug = slugify(old_project_name, {lower: true});

var git_url = process.argv[3];
if(!isGitUrl(git_url)) {
  shell.echo('The second param must be a valid git URL');
  shell.echo('Example: git@gitlab.com:company/repo.git');
  shell.echo('Given value: '+git_url);
  shell.exit(1);
}

if(!shell.which('git')) {
  shell.echo('This script requires git');
  shell.exit(1);
}

shell.echo('Setting origin URL to '+git_url);
if(shell.exec('git remote set-url origin '+git_url).code !== 0) {
  shell.echo('Error: git remote set-url failed');
  shell.exit(1);
}

function replaceTextInFile(find, replace, file) {
  shell.echo('Replacing "'+find+'" with "'+replace+'" in '+file);
  shell.sed('-i', find, replace, file);
}
replaceTextInFile(old_project_slug, new_project_slug, 'package.json');
replaceTextInFile(old_project_name, new_project_name, 'README.md');
replaceTextInFile(old_project_name, new_project_name, 'src/index.html');

shell.echo('Renaming Sublime Text project from "'+old_project_slug+'" to "'+new_project_slug+'"');
shell.mv('-f', old_project_slug+'.sublime-project', new_project_slug+'.sublime-project');
if(shell.test('-e', old_project_slug+'.sublime-workspace')) {
  shell.mv('-f', old_project_slug+'.sublime-workspace', new_project_slug+'.sublime-workspace');
  shell.sed('-i', '"project": "'+old_project_slug+'.sublime-project",', '"project": "'+new_project_slug+'.sublime-project",', new_project_slug+'.sublime-workspace');
}
