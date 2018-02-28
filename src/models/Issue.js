"use strict";

class Issue {

  constructor(description, done, priority, deadline, id){
    this.client_id = null;
    this.uuid = Math.floor(Math.random()*10000000);
    this.done = done;
    this.description = description || ('Issue #' + this.uuid);
    this.priority = priority;
    this.deadline = deadline || '';
    this.donedate = this.done ? this.deadline : '';
  }
}
