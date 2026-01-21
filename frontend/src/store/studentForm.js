import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/api/api";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import { toast } from "sonner";

export const fetchStudentForms = createAsyncThunk(
    "facultyForms/fetch",
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get("/student");
            return res.data.data;
        } catch (error) {
            // toast.error(extractErrorMsg(error) || "forms not found");
            return rejectWithValue(extractErrorMsg(error));
        }
    }
);

const initialState = {
    forms: [],
    loading: false,
    error: null,
    lastFetched: null,
}

const studentFormSlice = createSlice({
    name: "studentForms",
    initialState,
    reducers: {
        invalidateLastFetch: (state, action) => {
            state.lastFetched = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchStudentForms.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchStudentForms.fulfilled, (state, action) => {
                state.loading = false;
                state.forms = action.payload;
                state.lastFetched = Date.now();
            })
            .addCase(fetchStudentForms.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase("auth/logout", () => initialState);
    },
});

export const { invalidateLastFetch } = studentFormSlice.actions;
export default studentFormSlice.reducer;
