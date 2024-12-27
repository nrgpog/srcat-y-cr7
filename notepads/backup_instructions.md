# Instrucciones para Gestión de Backups

## Objetivo
- Mantener un registro organizado de cambios importantes en el código
- Preservar el contexto y las modificaciones previas
- Evitar alteraciones no deseadas en código ya validado

## Estructura de Backups
- Crear una carpeta `/backups` en la raíz del proyecto
- Organizar los backups por fecha y funcionalidad
- Mantener comentarios explicativos de los cambios realizados

## Formato de Archivo de Backup
- Nombre del archivo: `YYYYMMDD_descripcion_breve.md`
- Incluir los siguientes elementos:
  - Fecha y hora del cambio
  - Archivos modificados
  - Descripción del cambio
  - Código relevante
  - Contexto y razón del cambio

## Instrucciones para Claude
- Revisar la carpeta `/backups` antes de realizar nuevas modificaciones
- Respetar los cambios previamente guardados
- Mantener la consistencia con las modificaciones anteriores
- No alterar código que ya ha sido respaldado sin autorización explícita
- Informar si algún cambio nuevo podría afectar código respaldado

## Uso
1. Revisar los cambios propuestos por Claude
2. Si los cambios son satisfactorios, crear un nuevo archivo de backup
3. Referenciar este backup en futuras conversaciones cuando sea necesario mantener el contexto 