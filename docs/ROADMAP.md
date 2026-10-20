# Ideas para el futuro

Esto son anotaciones, no tareas. Nada de lo de aquí está construido ni debe construirse hasta que se decida (ver los no-objetivos en `blueprints/kuuchil-btz/blueprint.md` §1).

## Más armas

**Intención:** poder añadir armas nuevas (otra pistola, ametralladora, katana, armas ganadas a los jefes) sin reescribir el motor.

### Cómo está hoy (una sola arma, la pistola)

- Daño, cadencia, velocidad, vida de la bala y máximo en pantalla están fijos en `src/core/tuning.ts` (`shotSpeed`, `shotCooldownMs`, `shotLifetimeMs`, `maxShotsOnScreen`).
- El daño (`shotDamage`), la textura de la bala (`projectileTextureKey`) y la boca del arma (`muzzle`) están en `src/content/characters/kuuchil.ts`.
- La habilidad `shoot` vive en `src/characters/abilities/shoot.ts` y lee esos valores.
- La animación de disparo es una fila de la hoja `public/sprites/kuuchil.png`, referenciada desde `animations.shoot` del personaje.

### Qué cambiaría cada tipo de arma

| Arma | Además del dibujo |
|---|---|
| Otra pistola | Casi nada: otros valores y quizás otro sprite de bala |
| Ametralladora | Disparo automático al mantener presionado, cadencia mayor, quizás munición o recalentamiento, y su propia animación de disparo |
| Katana | Una habilidad nueva de ataque cuerpo a cuerpo: zona de golpe activa solo en ciertos cuadros, animaciones de tajo y sin proyectil |

Cambiar de arma **no** es solo cambiar sprites: cada arma trae su propio comportamiento.

### Diseño propuesto (cuando se decida la primera arma nueva)

1. **`WeaponDef` como datos**, igual que ya lo son enemigos y jefes, en `src/content/weapons/` y registrada en `src/content/registry.ts`. Campos probables: daño, cadencia, velocidad y alcance de la bala, si es automática, boca del arma, hitbox de golpe si es cuerpo a cuerpo, y qué animación usa.
2. **Arma equipada** en el personaje. La habilidad `shoot` lee los valores del arma equipada en lugar de `TUNING` y `CharacterDef`; lo que hoy es global pasa a ser dato del arma.
3. **Animaciones por arma:** una fila de la hoja por arma (por ejemplo `shoot-pistol`, `shoot-rifle`), elegida según el arma equipada. Las demás animaciones (correr, saltar, etc.) se comparten.
4. **Habilidad `melee`** nueva para la katana, registrada en `src/characters/abilityRegistry.ts`.
5. **Cambio de arma:** el mecanismo (tecla, menú o recompensa al vencer un jefe) se decide cuando exista la segunda arma.
6. **Pruebas:** que toda arma registrada tenga valores válidos y una animación existente, como `tests/content-registry.test.ts` hace con los enemigos.

### Qué no se toca

- La regla del aviso de ataques de jefe (`minTelegraphMs`) no depende del arma del jugador.
- Los controles siguen siendo acciones, no teclas: un cambio de arma necesitará una acción nueva en `src/input/actions.ts`.
