/*
function Animal(name){
  this.name = name;

};

Animal.prototype.eat = function(){};
Animal.prototype.sleep = function(){};
Animal.prototype.die = function(){};

function Tiger(name){
  Animal.call(this)
};

Tiger.prototype = Object.Create(Animal.prototype);
Tiger.prototype.kill = function(otherAnimal){
  otherAnimal.die();
}

let t = new Tiger('Johnny');
t.eat();
t.kill(new Animal('Nemo'));
*/

class Animal {
  constructor(name){
    this.name = name;

  }

  eat(){}
  sleep(){}
  die(){}
}

class Tiger extends Animal {
  constructor(name) {
    super(name);
  }

  kill(otherAnimal) {otherAnimal.die()};
}

let t = new Tiger('Johnny');
t.eat();
t.kill(new Animal('Nemo')); // let nemo = new Animal('Nemo');