import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { toast } from "sonner";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import EntityFormModal from "@/components/EntityFormModal";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function ClassTab() {
  const { dept_id } = useOutletContext();
  const axiosPrivate = useAxiosPrivate();

  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const isEditing = (id) => editingId === id;
  const isSaving = (id) => savingId === id;
  const isDeleting = (id) => deletingId === id;

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await axiosPrivate.get(`/admin/classes/${dept_id}`);
      setClasses(res.data.data);
    } catch (err) {
      toast.error(extractErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [dept_id]);

  const addBatch = () => {
    setEditData((prev) => ({
      ...prev,
      batches: [
        ...prev.batches,
        {
          code: "",
          type: "practical",
          rollRange: { from: 0, to: 0 },
        },
      ],
    }));
  };

  const removeBatch = (index) => {
    if (editData.batches.length === 1) return;
    setEditData((prev) => ({
      ...prev,
      batches: prev.batches.filter((_, i) => i !== index),
    }));
  };

  const isBatchValid = (b) => {
    if (!b.code) return false;
    if (!b.rollRange?.from || !b.rollRange?.to) return false;
    if (Number(b.rollRange.from) >= Number(b.rollRange.to)) return false;
    return true;
  };

  const canSave = useMemo(() => {
    if (!editData?.name || !editData?.year || !editData?.strength) return false;
    return editData.batches?.every(isBatchValid);
  }, [editData]);

  const handleCreate = async (data) => {
    try {
      const res = await axiosPrivate.post(
        `/admin/classes/${dept_id}`,
        data
      );
      toast.success(res.data.message || "Class created");
      setOpen(false);
      fetchClasses();
    } catch (err) {
      toast.error(extractErrorMsg(err));
    }
  };

  const handleUpdate = async (id) => {
    if (!canSave) {
      toast.error("Fix batch errors before saving");
      return;
    }

    setSavingId(id);
    try {
      const res = await axiosPrivate.patch(
        `/admin/class/${dept_id}/${id}`,
        editData
      );
      toast.success(res.data.message || "Class updated");
      setEditingId(null);
      setEditData({});
      fetchClasses();
    } catch (err) {
      toast.error(extractErrorMsg(err));
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this class?")) return;

    setDeletingId(id);
    try {
      const res = await axiosPrivate.delete(
        `/admin/class/${id}`
      );
      toast.success(res.data.message || "Class deleted");
      fetchClasses();
    } catch (err) {
      toast.error(extractErrorMsg(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Classes</h2>
          <p className="text-sm text-muted-foreground">
            Class and batch structure
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Add Class</Button>
      </div>

      <div className="border grid grid-cols-2 gap-3 p-3 rounded-xl max-h-2/6 overflow-y-auto">
        {loading ? (
          <div className="py-10 col-span-2 text-center text-muted-foreground">
            Loading classes...
          </div>
        ) : (
          classes.map((cls) => {
            const editing = isEditing(cls._id);
            const data = editing ? editData : cls;

            return (
              <Card
                key={cls._id}
                className={`${editing ? "border-blue-400" : ""} py-2`}
              >
                <CardContent className="px-2">
                  <div className="flex justify-between space-y-1">
                    {editing ? (
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <Input
                          className="h-8 text-sm"
                          value={editData.name}
                          onChange={(e) =>
                            setEditData({ ...editData, name: e.target.value })
                          }
                          disabled={isSaving(cls._id)}
                        />

                        <Select
                          value={editData.year}
                          onValueChange={(v) =>
                            setEditData({ ...editData, year: v })
                          }
                          disabled={isSaving(cls._id)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {["FY", "SY", "TY", "BY"].map((y) => (
                              <SelectItem key={y} value={y}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          type="number"
                          className="h-8 text-sm"
                          value={editData.strength}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              strength: e.target.value,
                            })
                          }
                          disabled={isSaving(cls._id)}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <h3 className="font-semibold">
                          {cls.year} {cls.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Strength: {cls.strength}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {editing ? (
                        <>
                          <Button
                            size="sm"
                            disabled={!canSave || isSaving(cls._id)}
                            onClick={() => handleUpdate(cls._id)}
                          >
                            {isSaving(cls._id) ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isSaving(cls._id)}
                            onClick={() => {
                              setEditingId(null);
                              setEditData({});
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(cls._id);
                              setEditData(cls);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isDeleting(cls._id)}
                            onClick={() => handleDelete(cls._id)}
                          >
                            {isDeleting(cls._id) ? "Deleting..." : "Delete"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 auto-rows-fr mt-2">
                    {data.batches.map((b, i) => (
                      <Card key={i} className="p-2 bg-muted">
                        <CardContent>
                          {editing ? (
                            <>
                              <div className="flex gap-1">
                                <Input
                                  className="h-7 text-sm"
                                  value={b.code}
                                  onChange={(e) => {
                                    const updated = [...editData.batches];
                                    updated[i].code = e.target.value;
                                    setEditData({
                                      ...editData,
                                      batches: updated,
                                    });
                                  }}
                                  disabled={isSaving(cls._id)}
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  disabled={
                                    editData.batches.length === 1 ||
                                    isSaving(cls._id)
                                  }
                                  onClick={() => removeBatch(i)}
                                >
                                  ❌
                                </Button>
                              </div>

                              <Select
                                value={b.type}
                                onValueChange={(v) => {
                                  const updated = [...editData.batches];
                                  updated[i].type = v;
                                  setEditData({
                                    ...editData,
                                    batches: updated,
                                  });
                                }}
                                disabled={isSaving(cls._id)}
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="practical">
                                    Practical
                                  </SelectItem>
                                  <SelectItem value="tutorial">
                                    Tutorial
                                  </SelectItem>
                                </SelectContent>
                              </Select>

                              <div className="grid grid-cols-2 gap-1">
                                <Input
                                  className="h-7 text-xs"
                                  type="number"
                                  value={b.rollRange.from}
                                  disabled={isSaving(cls._id)}
                                  onChange={(e) => {
                                    const updated = [...editData.batches];
                                    updated[i].rollRange.from = Number(
                                      e.target.value
                                    );
                                    setEditData({
                                      ...editData,
                                      batches: updated,
                                    });
                                  }}
                                />
                                <Input
                                  className="h-7 text-xs"
                                  type="number"
                                  value={b.rollRange.to}
                                  disabled={isSaving(cls._id)}
                                  onChange={(e) => {
                                    const updated = [...editData.batches];
                                    updated[i].rollRange.to = Number(
                                      e.target.value
                                    );
                                    setEditData({
                                      ...editData,
                                      batches: updated,
                                    });
                                  }}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between text-xs">
                                <span className="font-semibold">{b.code}</span>
                                <span className="px-2 py-0.5 rounded bg-muted-foreground/10">
                                  {b.type}
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {b.rollRange.from} – {b.rollRange.to}
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {editing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 w-full"
                      disabled={isSaving(cls._id)}
                      onClick={addBatch}
                    >
                      + Add Batch
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {open && (
        <EntityFormModal
          entity="classes"
          onClose={() => setOpen(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  );
}

export default ClassTab;
