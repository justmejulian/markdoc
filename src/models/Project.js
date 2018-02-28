"use strict";

class Project {

  constructor(title, id){
    this.client_id = null;
    this.uuid = id || Math.floor(Math.random()*10000000);
    this.title = title || 'Project #' + this.uuid;
    this.issues = [];
  }

  addIssue(issue){
    issue.client_id = this.client_id;
    this.issues.unshift(issue);
  }

  delIssue(id){
    let target;
    for(let i = 0; i < this.issues.length; i++){
      if(this.issues[i].uuid == id){
        target = i;
        break;
      }
    }
    if(target != undefined){
      this.issues.splice(target, 1);
    }
  }

  getIssue(id){
    for(let i = 0; i < this.issues.length; i++){
      if(this.issues[i].uuid == id){
        return this.issues[i];
      }
    }
  }

}
