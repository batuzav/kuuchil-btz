---
name: add-character
description: Añade un personaje jugable o una habilidad nueva (wall-jump, sable, etc.) como módulo enchufable. Úsalo cuando pidan "nuevo personaje", "wall jump", "sable", "nueva habilidad" o "add character".
---

# Añadir un personaje o una habilidad

## Cuándo usarlo
- "Añade wall-jump", "quiero un sable", "segundo personaje", "add an ability".

## Pasos — habilidad nueva
1. Crea `src/characters/abilities/<id>.ts` que exporte una `AbilityFactory` (ver `src/characters/ability.ts`): devuelve `{ id, update(input), reset() }`. Lógica pura, sin `phaser`.
2. Todas sus cifras van a `TUNING` en `src/core/tuning.ts`, comentadas con unidad.
3. Regístrala con una línea en `ABILITY_FACTORIES` de `src/characters/abilityRegistry.ts`.
4. Escribe `tests/<id>.test.ts` con entradas falsas (sin navegador).
5. Si necesita datos del mundo que `AbilityInput` no trae (p. ej. "toco pared"), añade el campo a `AbilityInput` y llénalo en `src/entities/Player.ts`.

## Pasos — personaje nuevo
1. Crea `src/content/characters/<id>.ts` copiando `src/content/characters/business-man.ts`: `id`, `name`, `textureKey`, `projectileTextureKey`, `hitbox`, `maxHp`, `shotDamage`, `abilities` (orden = orden de aplicación).
2. Regístralo en `src/content/registry.ts` (`CONTENT.characters`).
3. v1 usa `DEFAULT_CHARACTER_ID`; la selección de personaje es post-v1.

## Verify
```bash
pnpm test        # expect: exit 0, 0 failed
pnpm validate:content && pnpm typecheck && pnpm lint   # expect: exit 0
```

## No hagas
- No metas lógica de una habilidad dentro de `Player.ts`: Player solo aplica los efectos.
- No derives la hitbox del tamaño del sprite.
