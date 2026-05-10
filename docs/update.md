## Just update @angular/core and @angular/cli by using ng update command.

```bash
ng update @angular/core @angular/cli
or you can use npx command
npx @angular/cli update @angular/core @angular/cli
```

### If you are using Angular material You have to update it as well using ng update command.

> ng update @angular/material

### Update Angular CLI version Globally

```bash
npm uninstall -g @angular/cli
npm cache clean or npm cache verify (if npm > 5)
npm install -g @angular/cli@latest

If you are using MAC or linux systems you might need to add the prefix sudo before npm

sudo npm uninstall -g @angular/cli
sudo npm cache clean or sudo npm cache verify (if npm > 5)
sudo npm install -g @angular/cli@latest
```

### verifcar paquetes antiguos

npm outdated

### Agregar en enviroment al angular.json

```json
{
  "configurations": {
    "production": {
      "fileReplacements": [
        {
          "replace": "src/environments/environment.ts",
          "with": "src/environments/environment.prod.ts"
        }
      ]
    }
  }
}
```

### Generate build

ng build --configuration production --output-hashing=all

### Actulizar paquetes

Ejecutar npx npm-check-updates

> npx npm-check-updates

### Para actualizar los paquetes ejecutar el comando

> npx npm-check-updates -u

### O Puede instalar `npm-check-updates` para actualizar los paquetes de un proyecto.

Instalar `npm-check-updates` para actualizar los paquetes de un proyecto.

> npm install -g npm-check-updates

### Ejecutar el comando `ncu` para ver los paquetes que se pueden actualizar.

> ncu

### Ejecutar el comando `ncu -u` para actualizar los paquetes.

> ncu -u

### Update minor version angular

```bash
  ng update @angular/cli
  ng update @angular/core
```
