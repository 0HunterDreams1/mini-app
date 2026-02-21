import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';

/**
 * Ejemplo de uso del hook useApi
 * Este archivo muestra cómo integrar llamadas a la API en tus componentes
 */

// Define la interfaz para tus datos
interface User {
  id: number;
  name: string;
  email: string;
}

export function ExampleApiUsage() {
  const { data, loading, error, get } = useApi<User[]>();

  // Realizar la llamada cuando el componente se monta
  useEffect(() => {
    get('/api/users'); // Reemplaza con tu endpoint real
  }, [get]);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Usuarios</h1>
      {data && data.length > 0 ? (
        <ul>
          {data.map((user) => (
            <li key={user.id}>
              {user.name} ({user.email})
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay datos disponibles</p>
      )}
    </div>
  );
}

/**
 * Ejemplo con POST:
 * 
 * const { post, loading, error } = useApi<User>();
 * 
 * const handleCreateUser = async () => {
 *   try {
 *     const newUser = await post('/api/users', {
 *       name: 'Juan',
 *       email: 'juan@example.com'
 *     });
 *     console.log('Usuario creado:', newUser);
 *   } catch (err) {
 *     console.error('Error al crear usuario:', err);
 *   }
 * };
 */
