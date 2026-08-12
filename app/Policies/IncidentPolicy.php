<?php

namespace App\Policies;

use App\Models\Incident;
use App\Models\User;

/**
 * Autorización de Incidencias.
 *
 * El alcance por puesto (un agente solo ve las incidencias de su
 * propio puesto) se aplica en el listado (`IncidentController::index`),
 * no aquí: esta policy solo decide quién puede editar/eliminar un
 * registro puntual. Un superadmin puede todo; un agente solo puede
 * modificar las incidencias que él mismo reportó.
 */
class IncidentPolicy
{
    public function update(User $user, Incident $incident): bool
    {
        return $user->isSuperAdmin() || $incident->user_id === $user->id;
    }

    public function delete(User $user, Incident $incident): bool
    {
        return $this->update($user, $incident);
    }
}
