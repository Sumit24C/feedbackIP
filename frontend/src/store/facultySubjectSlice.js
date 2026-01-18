import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/api/api";
import { extractErrorMsg } from "@/utils/extractErrorMsg";

export const fetchFacultySubjects = createAsyncThunk(
    "facultySubjects/fetch",
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get("/faculty");
            return res.data.data;
        } catch (error) {
            return rejectWithValue(extractErrorMsg(error));
        }
    }
);

const facultySubjectSlice = createSlice({
    name: "facultySubjects",
    initialState: {
        entities: [],
        loading: false,
        error: null,
        lastFetched: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchFacultySubjects.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchFacultySubjects.fulfilled, (state, action) => {
                state.loading = false;
                state.entities = action.payload;
                state.lastFetched = Date.now();
            })
            .addCase(fetchFacultySubjects.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default facultySubjectSlice.reducer;
