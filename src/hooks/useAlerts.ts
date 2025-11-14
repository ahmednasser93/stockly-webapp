import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
} from "../api/alerts";
import type { CreateAlertRequest, UpdateAlertRequest } from "../types";

export function useAlerts() {
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: ["alerts"],
    queryFn: listAlerts,
    staleTime: 30 * 1000, // 30 seconds
  });

  const createMutation = useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAlertRequest }) =>
      updateAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const handleCreate = async (data: CreateAlertRequest) => {
    return createMutation.mutateAsync(data);
  };

  const handleUpdate = async (id: string, data: UpdateAlertRequest) => {
    return updateMutation.mutateAsync({ id, data });
  };

  const handleDelete = async (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  return {
    alerts: alertsQuery.data ?? [],
    isLoading: alertsQuery.isLoading,
    isError: alertsQuery.isError,
    error: alertsQuery.error,
    refetch: alertsQuery.refetch,
    createAlert: handleCreate,
    updateAlert: handleUpdate,
    deleteAlert: handleDelete,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}

