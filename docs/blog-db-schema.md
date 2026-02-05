# Esquema de Base de Datos - Blog tipo Reddit/X

Este documento describe el esquema de base de datos propuesto para migrar el blog de localStorage a una base de datos relacional.

## Tablas

### 1. `users`

Tabla de usuarios registrados en el blog.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `UUID` / `INT` | PRIMARY KEY, AUTO_INCREMENT | Identificador único del usuario |
| `username` | `VARCHAR(50)` | UNIQUE, NOT NULL | Nombre de usuario único |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | Email del usuario |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Hash de la contraseña (bcrypt) |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Fecha de registro |
| `updated_at` | `TIMESTAMP` | NULL, ON UPDATE CURRENT_TIMESTAMP | Última actualización |

**Índices:**
- `idx_username` en `username`
- `idx_email` en `email`

---

### 2. `topics`

Tabla de temas/posts principales del blog.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `UUID` / `INT` | PRIMARY KEY, AUTO_INCREMENT | Identificador único del tema |
| `title` | `VARCHAR(255)` | NOT NULL | Título del tema |
| `author_id` | `UUID` / `INT` | FOREIGN KEY → `users(id)`, NOT NULL | Usuario que creó el tema |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| `updated_at` | `TIMESTAMP` | NULL, ON UPDATE CURRENT_TIMESTAMP | Última actualización |
| `is_deleted` | `BOOLEAN` | DEFAULT FALSE | Soft delete |

**Relaciones:**
- `author_id` → `users.id` (ON DELETE CASCADE)

**Índices:**
- `idx_author_id` en `author_id`
- `idx_created_at` en `created_at` (para ordenar por más recientes)

---

### 3. `comments`

Tabla de comentarios en los temas. Soporta replies anidados mediante `parent_comment_id`.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `UUID` / `INT` | PRIMARY KEY, AUTO_INCREMENT | Identificador único del comentario |
| `topic_id` | `UUID` / `INT` | FOREIGN KEY → `topics(id)`, NOT NULL | Tema al que pertenece |
| `author_id` | `UUID` / `INT` | FOREIGN KEY → `users(id)`, NOT NULL | Usuario que escribió el comentario |
| `parent_comment_id` | `UUID` / `INT` | FOREIGN KEY → `comments(id)`, NULL | ID del comentario padre (para replies) |
| `text` | `TEXT` | NOT NULL | Contenido del comentario |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| `updated_at` | `TIMESTAMP` | NULL, ON UPDATE CURRENT_TIMESTAMP | Última edición |
| `is_deleted` | `BOOLEAN` | DEFAULT FALSE | Soft delete |

**Relaciones:**
- `topic_id` → `topics.id` (ON DELETE CASCADE)
- `author_id` → `users.id` (ON DELETE CASCADE)
- `parent_comment_id` → `comments.id` (ON DELETE CASCADE, self-referencing)

**Índices:**
- `idx_topic_id` en `topic_id`
- `idx_author_id` en `author_id`
- `idx_parent_comment_id` en `parent_comment_id`
- `idx_created_at` en `created_at` (para ordenar por más nuevos primero)

**Notas:**
- Si `parent_comment_id` es `NULL`, es un comentario de nivel raíz (top-level).
- Si `parent_comment_id` tiene valor, es una respuesta (reply) a otro comentario.
- **Orden por defecto:** `ORDER BY created_at DESC` (más nuevos arriba).

---

### 4. `comment_votes`

Tabla para votos (upvotes) en comentarios. Un usuario solo puede votar una vez por comentario.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `UUID` / `INT` | PRIMARY KEY, AUTO_INCREMENT | Identificador único del voto |
| `comment_id` | `UUID` / `INT` | FOREIGN KEY → `comments(id)`, NOT NULL | Comentario votado |
| `user_id` | `UUID` / `INT` | FOREIGN KEY → `users(id)`, NOT NULL | Usuario que vota |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Fecha del voto |

**Relaciones:**
- `comment_id` → `comments.id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE CASCADE)

**Restricciones únicas:**
- `UNIQUE(comment_id, user_id)` — Un usuario solo puede votar una vez por comentario.

**Índices:**
- `idx_comment_id` en `comment_id`
- `idx_user_id` en `user_id`
- `unique_vote` en `(comment_id, user_id)` (composite unique index)

**Notas:**
- Para obtener el total de votos de un comentario: `SELECT COUNT(*) FROM comment_votes WHERE comment_id = ?`
- Para verificar si un usuario votó: `SELECT EXISTS(SELECT 1 FROM comment_votes WHERE comment_id = ? AND user_id = ?)`

---

## Queries comunes

### Obtener temas con contador de comentarios

```sql
SELECT 
  t.id,
  t.title,
  t.created_at,
  u.username AS author,
  COUNT(c.id) AS comment_count
FROM topics t
LEFT JOIN users u ON t.author_id = u.id
LEFT JOIN comments c ON t.id = c.topic_id AND c.is_deleted = FALSE
WHERE t.is_deleted = FALSE
GROUP BY t.id, t.title, t.created_at, u.username
ORDER BY t.created_at DESC;
```

### Obtener comentarios de un tema con votos

```sql
SELECT 
  c.id,
  c.text,
  c.parent_comment_id,
  c.created_at,
  u.username AS author,
  COUNT(cv.id) AS vote_count,
  EXISTS(
    SELECT 1 FROM comment_votes 
    WHERE comment_id = c.id AND user_id = ?
  ) AS user_has_voted
FROM comments c
LEFT JOIN users u ON c.author_id = u.id
LEFT JOIN comment_votes cv ON c.comment_id = cv.comment_id
WHERE c.topic_id = ? AND c.is_deleted = FALSE
GROUP BY c.id, c.text, c.parent_comment_id, c.created_at, u.username
ORDER BY c.created_at DESC; -- Más nuevos primero
```

### Crear un voto (con manejo de duplicados)

```sql
INSERT INTO comment_votes (comment_id, user_id)
VALUES (?, ?)
ON CONFLICT (comment_id, user_id) DO NOTHING; -- PostgreSQL
-- o
INSERT IGNORE INTO comment_votes (comment_id, user_id) VALUES (?, ?); -- MySQL
```

### Eliminar un voto (toggle)

```sql
DELETE FROM comment_votes
WHERE comment_id = ? AND user_id = ?;
```

---

## Diagrama de Relaciones

```
users
  └─── 1:N topics (author_id)
  └─── 1:N comments (author_id)
  └─── 1:N comment_votes (user_id)

topics
  └─── 1:N comments (topic_id)

comments
  └─── 1:N comments (parent_comment_id, self-referencing)
  └─── 1:N comment_votes (comment_id)
```

---

## Consideraciones de implementación

### 1. **Paginación de comentarios**
Para temas con muchos comentarios, implementar paginación:
```sql
SELECT ... 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 0;
```

### 2. **Soft deletes**
Usar `is_deleted = TRUE` en lugar de `DELETE` para mantener integridad referencial y permitir recuperación.

### 3. **Índices compuestos**
Para queries frecuentes:
- `(topic_id, created_at)` en `comments`
- `(comment_id, user_id)` en `comment_votes`

### 4. **Contadores desnormalizados (opcional)**
Para mejor performance, agregar campos:
- `topics.comment_count` (actualizar con trigger)
- `comments.vote_count` (actualizar con trigger)

### 5. **Replies anidados (threading)**
Para mostrar replies correctamente:
- Usar queries recursivas (CTEs) o
- Cargar todos los comentarios y estructurar en el frontend

### 6. **Validaciones**
- `parent_comment_id` debe pertenecer al mismo `topic_id`
- Un comentario no puede ser su propio padre
- Limitar profundidad de replies (ej: máximo 3 niveles)

---

## Migración desde localStorage

Pasos sugeridos:
1. Crear usuario por defecto para temas/comentarios existentes
2. Migrar `topics` desde `topicsData` JSON
3. Migrar comentarios desde `localStorage.getItem("topicComments:<id>")`
4. Los votos actuales (`comment.votes`) convertirlos en N filas en `comment_votes` con usuarios ficticios o resetear a 0

---

## Tecnologías sugeridas

- **PostgreSQL**: Mejor soporte para JSON, CTEs recursivos, y restricciones complejas
- **MySQL/MariaDB**: Alternativa más común, buen rendimiento
- **SQLite**: Para desarrollo/testing

**ORM recomendados:**
- Prisma (TypeScript)
- TypeORM (TypeScript)
- Sequelize (JavaScript/TypeScript)
