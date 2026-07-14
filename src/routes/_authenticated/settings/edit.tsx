import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";

export const Route = createFileRoute("/_authenticated/settings/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    mobile: "",
    email: "",
    specialization: "",
    qualification: "",
    registration_number: "",
    experience_years: "",
    consultation_fee: "",
    on_call_fee: "",
    followup_fee: "",
    gender: "",
    dob: "",
    address: "",
    clinic_name: "",
    clinic_address: "",
    city: "",
    state: "",
    pincode: "",
    available_days: [] as string[],
    from_time: "",
    to_time: "",
    consultation_mode: "",
    languages: "",
    emergency_contact: "",
    profile_image: "",
    about: "",
  });
  const weekDayOptions = [
    { value: "Monday", label: "Monday" },
    { value: "Tuesday", label: "Tuesday" },
    { value: "Wednesday", label: "Wednesday" },
    { value: "Thursday", label: "Thursday" },
    { value: "Friday", label: "Friday" },
    { value: "Saturday", label: "Saturday" },
    { value: "Sunday", label: "Sunday" },
  ];
  //   const doctorId = localStorage.getItem("doctorId");
  const doctorId = 12;

  useEffect(() => {
    fetchDoctor();
  }, []);

  const fetchDoctor = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/users/doctors/${doctorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setForm({
        full_name: res.data.full_name || "",
        mobile: res.data.mobile || "",
        email: res.data.email || "",
        specialization: res.data.specialization || "",
        qualification: res.data.qualification || "",
        registration_number: res.data.registration_number || "",
        experience_years: res.data.experience_years || "",
        consultation_fee: res.data.consultation_fee || "",
        on_call_fee: res.data.on_call_fee || "",
        followup_fee: res.data.followup_fee || "",
        gender: res.data.gender || "",
        dob: res.data.dob || "",
        address: res.data.address || "",
        clinic_name: res.data.clinic_name || "",
        clinic_address: res.data.clinic_address || "",
        city: res.data.city || "",
        state: res.data.state || "",
        pincode: res.data.pincode || "",
        available_days: res.data.available_days || "",
        from_time: res.data.from_time || "",
        to_time: res.data.to_time || "",
        consultation_mode: res.data.consultation_mode || "",
        languages: res.data.languages || "",
        emergency_contact: res.data.emergency_contact || "",
        profile_image: res.data.profile_image || "",
        about: res.data.about || "",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const updateDoctor = async () => {
    const requiredFields = [
      "full_name",
      "mobile",
      "specialization",
      "qualification",
      "registration_number",
      "experience_years",
      "consultation_fee",
      "clinic_name",
      "available_days",
      "from_time",
      "to_time",
    ];

    const missing = requiredFields.filter((field) => !form[field as keyof typeof form]);

    if (missing.length) {
      alert(`Please fill all required fields:\n${missing.join(", ")}`);
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      await axios.put(`${import.meta.env.VITE_API_URL}/users/doctors/${doctorId}`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Doctor profile updated successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter((d) => d !== day)
        : [...prev.available_days, day],
    }));
  };
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Edit Doctor Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="full_name"
          placeholder="Full Name *"
          value={form.full_name}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          name="mobile"
          placeholder="Mobile Number *"
          value={form.mobile}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          name="specialization"
          placeholder="Specialization *"
          value={form.specialization}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          name="qualification"
          placeholder="Qualification *"
          value={form.qualification}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          name="registration_number"
          placeholder="Medical Registration Number *"
          value={form.registration_number}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          type="number"
          name="experience_years"
          placeholder="Experience Years *"
          value={form.experience_years}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          type="number"
          name="consultation_fee"
          placeholder="Consultation Fee (₹) *"
          value={form.consultation_fee}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          type="number"
          name="on_call_fee"
          placeholder="On Call Fee (₹)"
          value={form.on_call_fee}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          type="number"
          name="followup_fee"
          placeholder="Follow-up Fee (₹)"
          value={form.followup_fee}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          className="border p-3 rounded"
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <input
          type="date"
          name="dob"
          value={form.dob}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        {/* <input
          name="clinic_name"
          placeholder="Clinic/Hospital Name *"
          value={form.clinic_name}
          onChange={handleChange}
          className="border p-3 rounded"
        /> */}

        {/* <input
          name="clinic_address"
          placeholder="Clinic Address"
          value={form.clinic_address}
          onChange={handleChange}
          className="border p-3 rounded"
        /> */}

        {/* <input
          name="city"
          placeholder="City"
          value={form.city}
          onChange={handleChange}
          className="border p-3 rounded"
        /> */}

        {/* <input
          name="state"
          placeholder="State"
          value={form.state}
          onChange={handleChange}
          className="border p-3 rounded"
        /> */}

        {/* <input
          name="pincode"
          placeholder="Pincode"
          value={form.pincode}
          onChange={handleChange}
          className="border p-3 rounded"
        /> */}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Available Days *</label>

          <Select
            isMulti
            options={weekDayOptions}
            placeholder="Select available days..."
            value={weekDayOptions.filter((option) => form.available_days.includes(option.value))}
            onChange={(selectedOptions) =>
              setForm({
                ...form,
                available_days: selectedOptions
                  ? selectedOptions.map((option) => option.value)
                  : [],
              })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Available From *</label>

          <input
            type="time"
            name="from_time"
            value={form.from_time}
            onChange={handleChange}
            className="w-full border p-3 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Available To *</label>

          <input
            type="time"
            name="to_time"
            value={form.to_time}
            onChange={handleChange}
            className="w-full border p-3 rounded"
          />
        </div>

        <select
          name="consultation_mode"
          value={form.consultation_mode}
          onChange={handleChange}
          className="border p-3 rounded"
        >
          <option value="">Consultation Mode</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
          <option value="Both">Both</option>
        </select>

        <input
          name="languages"
          placeholder="Languages Spoken"
          value={form.languages}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          name="emergency_contact"
          placeholder="Emergency Contact"
          value={form.emergency_contact}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          name="profile_image"
          placeholder="Profile Image URL"
          value={form.profile_image}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          name="address"
          placeholder="Residential Address"
          value={form.address}
          onChange={handleChange}
          className="border p-3 rounded md:col-span-2"
        />

        <textarea
          name="about"
          placeholder="About Doctor"
          value={form.about}
          onChange={handleChange}
          rows={5}
          className="border p-3 rounded md:col-span-2"
        />
      </div>

      <button
        onClick={updateDoctor}
        disabled={loading}
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded"
      >
        {loading ? "Updating..." : "Update Profile"}
      </button>
    </div>
  );
}

export default RouteComponent;
