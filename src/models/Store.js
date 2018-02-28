"use strict";

class Store {

  constructor(title, info){
    this.client_id = this.createUuid();
    this.title = title || 'Riot.js Application';
    this.info = info || 'Riot.js Application';
    this.projects = [];
    this.active = 0;
  }

  addProject(project){
    project.client_id = this.client_id;
    this.projects.push(project);
    this.active = project.uuid;
  }

  getProject(id){
    for(let i = 0; i < this.projects.length; i++){
      if(this.projects[i].uuid == id){
        return this.projects[i];
      }
    }
  }

  getActiveProject(){
    if(this.active){
      return this.getProject(this.active);
    }
    else{
      return {title: '[null]'};
    }
  }

  delExampleProjects(){
    var target;
    for(var p = 1; p < 4; p++){
      for(var i = 0; i < this.projects.length; i++){
        if(this.projects[i].uuid == p){
          target = i;
          break;
        }
      }
      if(target != undefined){
        this.projects.splice(target, 1);
      }
    }
    this.active = 0;
  }

  delActiveProject(){
    if(this.active){
      var target;
      for(var i = 0; i < this.projects.length; i++){
        if(this.projects[i].uuid == this.active){
          target = i;
          break;
        }
      }
      if(target != undefined){
        this.projects.splice(target, 1);
      }
    }
    this.active = 0;
  }

  createUuid() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }

}
