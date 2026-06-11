import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Car, Pencil, Plus, X } from "lucide-react";

import { accessRulesAPI, vehicleTypesAPI, vehiclesAPI } from "../api/api";
import { formatVehicleType, formatVietnamDateTime } from "../utils/format";
import Loading from "./Loading";

const emptyVehicleForm = {
  plate: "",
  owner_name: "",
  owner_phone: "",
  owner_cccd: "",
  owner_address: "",
  vehicle_type_id: "",
  is_internal: false,
};

const emptyRuleForm = {
  vehicle_id: "",
  plate: "",
  rule_type: 1,
  description: "",
  valid_from: "",
  valid_to: "",
};

const normalizePlate = (plate) => plate.trim().toUpperCase();

const normalizeText = (value) => {
  const text = value.trim();
  return text || "";
};

const getErrorMessage = (err, fallback) => {
  const detail = err.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => `${item.loc?.join(".")}: ${item.msg}`).join("; ");
  }

  return detail || fallback;
};

const formatRuleTypeLabel = (ruleType) => {
  const value = Number(ruleType);
  return value === 1 ? "Blacklist" : "Whitelist";
};

function VehiclePanel() {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [accessRules, setAccessRules] = useState([]);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [ruleForm, setRuleForm] = useState(emptyRuleForm);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [vehicleFieldErrors, setVehicleFieldErrors] = useState({});
  const [ruleFieldErrors, setRuleFieldErrors] = useState({});
  const [vehicleError, setVehicleError] = useState("");
  const [ruleError, setRuleError] = useState("");
  const [vehicleSuccessMessage, setVehicleSuccessMessage] = useState("");
  const [ruleSuccessMessage, setRuleSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [savingRule, setSavingRule] = useState(false);

  const activeVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.status !== 10),
    [vehicles],
  );

  const activeRules = useMemo(
    () => accessRules.filter((rule) => rule.status !== 10),
    [accessRules],
  );

  const loadData = useCallback(async () => {
    try {
      setVehicleError("");
      setRuleError("");

      const [vehiclesRes, vehicleTypesRes, accessRulesRes] = await Promise.all([
        vehiclesAPI.list(),
        vehicleTypesAPI.list(),
        accessRulesAPI.list(),
      ]);

      setVehicles(Array.isArray(vehiclesRes.data) ? vehiclesRes.data : []);
      setVehicleTypes(Array.isArray(vehicleTypesRes.data) ? vehicleTypesRes.data : []);
      setAccessRules(Array.isArray(accessRulesRes.data) ? accessRulesRes.data : []);
    } catch (err) {
      console.error("Failed to load vehicle panel data:", err);
      setVehicleError("Không thể tải dữ liệu phương tiện");
    } finally {
      setLoading(false);
    }
  }, []);

  const resetVehicleForm = () => {
    setEditingVehicleId(null);
    setVehicleForm(emptyVehicleForm);
    setVehicleFieldErrors({});
  };

  const resetRuleForm = () => {
    setRuleForm(emptyRuleForm);
    setRuleFieldErrors({});
  };

  const handleVehicleFormChange = (field, value) => {
    setVehicleForm((current) => ({
      ...current,
      [field]: value,
    }));

    setVehicleFieldErrors((current) => ({
      ...current,
      [field]: "",
    }));
    setVehicleSuccessMessage("");
  };

  const handleRuleFormChange = (field, value) => {
    setRuleForm((current) => ({
      ...current,
      [field]: value,
    }));

    setRuleFieldErrors((current) => ({
      ...current,
      [field]: "",
    }));
    setRuleSuccessMessage("");
  };

  const validateVehicleForm = () => {
    const nextErrors = {};

    if (!normalizePlate(vehicleForm.plate)) {
      nextErrors.plate = "Biển số không được để trống";
    }

    setVehicleFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateRuleForm = () => {
    const nextErrors = {};

    if (!normalizePlate(ruleForm.plate)) {
      nextErrors.plate = "Biển số không được để trống";
    }

    if (ruleForm.rule_type === "" || ruleForm.rule_type === null || ruleForm.rule_type === undefined) {
      nextErrors.rule_type = "Vui lòng chọn loại rule";
    }

    if (ruleForm.valid_from && ruleForm.valid_to) {
      const fromDate = new Date(ruleForm.valid_from);
      const toDate = new Date(ruleForm.valid_to);

      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
        nextErrors.valid_from = "Thời gian không hợp lệ";
      } else if (fromDate > toDate) {
        nextErrors.valid_to = "Thời gian kết thúc phải sau thời gian bắt đầu";
      }
    }

    setRuleFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildVehiclePayload = () => ({
    plate: normalizePlate(vehicleForm.plate),
    owner_name: normalizeText(vehicleForm.owner_name),
    owner_phone: normalizeText(vehicleForm.owner_phone),
    owner_cccd: normalizeText(vehicleForm.owner_cccd),
    owner_address: normalizeText(vehicleForm.owner_address),
    vehicle_type_id: vehicleForm.vehicle_type_id ? Number(vehicleForm.vehicle_type_id) : null,
    is_internal: Boolean(vehicleForm.is_internal),
  });

  const buildRulePayload = () => ({
    plate: normalizePlate(ruleForm.plate),
    rule_type: Number(ruleForm.rule_type),
    description: normalizeText(ruleForm.description),
    valid_from: ruleForm.valid_from || null,
    valid_to: ruleForm.valid_to || null,
  });

  const handleVehicleSubmit = async (event) => {
    event.preventDefault();
    setVehicleError("");
    setVehicleSuccessMessage("");

    if (!validateVehicleForm()) {
      return;
    }

    try {
      setSavingVehicle(true);
      const payload = buildVehiclePayload();

      if (editingVehicleId) {
        await vehiclesAPI.update(editingVehicleId, payload);
        setVehicleSuccessMessage("Đã cập nhật phương tiện");
      } else {
        await vehiclesAPI.create(payload);
        setVehicleSuccessMessage("Đã thêm phương tiện");
      }

      resetVehicleForm();
      await loadData();
    } catch (err) {
      console.error("Failed to save vehicle:", err);
      setVehicleError(getErrorMessage(err, "Lưu phương tiện thất bại"));
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleRuleSubmit = async (event) => {
    event.preventDefault();
    setRuleError("");
    setRuleSuccessMessage("");

    if (!validateRuleForm()) {
      return;
    }

    try {
      setSavingRule(true);
      await accessRulesAPI.create(buildRulePayload());
      setRuleSuccessMessage("Đã thêm luật truy cập");
      resetRuleForm();
      await loadData();
    } catch (err) {
      console.error("Failed to save access rule:", err);
      setRuleError(getErrorMessage(err, "Lưu access rule thất bại"));
    } finally {
      setSavingRule(false);
    }
  };

  const handleEditVehicle = (vehicle) => {
    setVehicleError("");
    setVehicleSuccessMessage("");
    setVehicleFieldErrors({});
    setEditingVehicleId(vehicle.id);
    setVehicleForm({
      plate: vehicle.plate || "",
      owner_name: vehicle.owner_name || "",
      owner_phone: vehicle.owner_phone || "",
      owner_cccd: vehicle.owner_cccd || "",
      owner_address: vehicle.owner_address || "",
      vehicle_type_id: vehicle.vehicle_type_id == null ? "" : String(vehicle.vehicle_type_id),
      is_internal: Boolean(vehicle.is_internal),
    });
  };

  const handleSelectVehicleForRule = (vehicleId) => {
    handleRuleFormChange("vehicle_id", vehicleId);

    const selectedVehicle = vehicles.find((vehicle) => String(vehicle.id) === String(vehicleId));
    handleRuleFormChange("plate", selectedVehicle?.plate || "");
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="ops-page vehicle-page">
      <section className="ops-panel vehicle-form-panel">
        <div className="panel-header">
          <div>
            <h3>{editingVehicleId ? "Cập nhật phương tiện" : "Thêm phương tiện"}</h3>
            <p>Quản lý danh sách xe trước khi gán rule ra vào</p>
          </div>
        </div>

        <form className="vehicle-form" onSubmit={handleVehicleSubmit} noValidate>
          <label className="vehicle-field">
            <span>Biển số</span>
            <input
              value={vehicleForm.plate}
              onChange={(event) => handleVehicleFormChange("plate", event.target.value)}
              placeholder="VD: 30A12345"
              aria-invalid={Boolean(vehicleFieldErrors.plate)}
            />
            {vehicleFieldErrors.plate && <em>{vehicleFieldErrors.plate}</em>}
          </label>

          <label className="vehicle-field">
            <span>Loại xe</span>
            <select
              value={vehicleForm.vehicle_type_id}
              onChange={(event) => handleVehicleFormChange("vehicle_type_id", event.target.value)}
            >
              <option value="">Chưa xác định</option>
              {vehicleTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name || formatVehicleType(type.id)}
                </option>
              ))}
            </select>
          </label>

          <label className="vehicle-toggle">
            <input
              type="checkbox"
              checked={vehicleForm.is_internal}
              onChange={(event) => handleVehicleFormChange("is_internal", event.target.checked)}
            />
            <span>Xe nội bộ</span>
          </label>

          <div className="vehicle-owner-grid">
            <label className="vehicle-field">
              <span>Tên chủ xe</span>
              <input
                value={vehicleForm.owner_name}
                onChange={(event) => handleVehicleFormChange("owner_name", event.target.value)}
                placeholder="Nhập tên chủ xe"
              />
            </label>

            <label className="vehicle-field">
              <span>Số điện thoại</span>
              <input
                value={vehicleForm.owner_phone}
                onChange={(event) => handleVehicleFormChange("owner_phone", event.target.value)}
                placeholder="Nhập số điện thoại"
              />
            </label>

            <label className="vehicle-field">
              <span>Số CCCD</span>
              <input
                value={vehicleForm.owner_cccd}
                onChange={(event) => handleVehicleFormChange("owner_cccd", event.target.value)}
                placeholder="Nhập số CCCD"
              />
            </label>

            <label className="vehicle-field vehicle-field-wide">
              <span>Địa chỉ</span>
              <input
                value={vehicleForm.owner_address}
                onChange={(event) => handleVehicleFormChange("owner_address", event.target.value)}
                placeholder="Nhập địa chỉ chủ xe"
              />
            </label>
          </div>

          <div className="vehicle-form-actions">
            <button className="camera-action-button start" type="submit" disabled={savingVehicle}>
              <Plus className="w-4 h-4" />
              {savingVehicle ? "Đang lưu..." : editingVehicleId ? "Lưu xe" : "Thêm xe"}
            </button>
            {editingVehicleId && (
              <button
                className="camera-action-button cancel"
                type="button"
                onClick={resetVehicleForm}
                disabled={savingVehicle}
              >
                <X className="w-4 h-4" />
                Hủy
              </button>
            )}
          </div>
        </form>

        {vehicleError && <div className="camera-error">{vehicleError}</div>}
        {vehicleSuccessMessage && <div className="vehicle-success">{vehicleSuccessMessage}</div>}
      </section>

      <section className="ops-panel vehicle-rule-panel">
        <div className="panel-header">
          <div>
            <h3>Thêm luật truy cập</h3>
          </div>
        </div>

        <form className="vehicle-form" onSubmit={handleRuleSubmit} noValidate>
          <label className="vehicle-field">
            <span>Chọn xe</span>
            <select
              value={ruleForm.vehicle_id}
              onChange={(event) => handleSelectVehicleForRule(event.target.value)}
            >
              <option value="">Chọn từ danh sách xe</option>
              {activeVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate} - {vehicle.owner_name || "Chưa có tên chủ xe"}
                </option>
              ))}
            </select>
          </label>

          <label className="vehicle-field">
            <span>Biển số</span>
            <input
              value={ruleForm.plate}
              onChange={(event) => handleRuleFormChange("plate", event.target.value)}
              placeholder="VD: 30A12345"
              aria-invalid={Boolean(ruleFieldErrors.plate)}
            />
            {ruleFieldErrors.plate && <em>{ruleFieldErrors.plate}</em>}
          </label>

          <label className="vehicle-field">
            <span>Loại rule</span>
            <select
              value={ruleForm.rule_type}
              onChange={(event) => handleRuleFormChange("rule_type", Number(event.target.value))}
            >
              <option value={0}>Whitelist</option>
              <option value={1}>Blacklist</option>
            </select>
            {ruleFieldErrors.rule_type && <em>{ruleFieldErrors.rule_type}</em>}
          </label>

          <label className="vehicle-field">
            <span>Mô tả</span>
            <input
              value={ruleForm.description}
              onChange={(event) => handleRuleFormChange("description", event.target.value)}
              placeholder="Nhập mô tả rule"
            />
          </label>

          <div className="vehicle-owner-grid">
            <label className="vehicle-field">
              <span>Hiệu lực từ</span>
              <input
                type="datetime-local"
                value={ruleForm.valid_from}
                onChange={(event) => handleRuleFormChange("valid_from", event.target.value)}
              />
              {ruleFieldErrors.valid_from && <em>{ruleFieldErrors.valid_from}</em>}
            </label>

            <label className="vehicle-field">
              <span>Hiệu lực đến</span>
              <input
                type="datetime-local"
                value={ruleForm.valid_to}
                onChange={(event) => handleRuleFormChange("valid_to", event.target.value)}
              />
              {ruleFieldErrors.valid_to && <em>{ruleFieldErrors.valid_to}</em>}
            </label>
          </div>

          <div className="vehicle-form-actions">
            <button className="camera-action-button start" type="submit" disabled={savingRule}>
              <Plus className="w-4 h-4" />
              {savingRule ? "Đang lưu..." : "Thêm rule"}
            </button>
            <button
              className="camera-action-button cancel"
              type="button"
              onClick={resetRuleForm}
              disabled={savingRule}
            >
              <X className="w-4 h-4" />
              Hủy
            </button>
          </div>
        </form>

        {ruleError && <div className="camera-error">{ruleError}</div>}
        {ruleSuccessMessage && <div className="vehicle-success">{ruleSuccessMessage}</div>}
      </section>

      <section className="ops-panel vehicle-list-panel">
        <div className="panel-header">
          <div>
            <h3>Danh sách phương tiện</h3>
            <p>{activeVehicles.length} xe đang quản lý</p>
          </div>
        </div>

        {activeVehicles.length > 0 ? (
          <div className="vehicle-list">
            {activeVehicles.map((vehicle) => (
              <div className="vehicle-row" key={vehicle.id}>
                <div className="vehicle-icon">
                  <Car className="w-5 h-5" />
                </div>
                <div className="vehicle-row-main">
                  <strong>{vehicle.plate}</strong>
                  <span>{formatVehicleType(vehicle.vehicle_type_id)}</span>
                  <p>Tên chủ xe: {vehicle.owner_name || "Chưa có tên chủ xe"}</p>
                  <small>SĐT chủ xe: {vehicle.owner_phone || "Chưa có số điện thoại"}</small>
                </div>
                <em>{vehicle.is_internal ? "Xe nội bộ" : "Xe bên ngoài"}</em>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => handleEditVehicle(vehicle)}
                  aria-label="Sửa phương tiện"
                  title="Sửa"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state compact">Chưa có phương tiện nào</div>
        )}
      </section>

      <section className="ops-panel vehicle-rule-list-panel">
        <div className="panel-header">
          <div>
            <h3>Danh sách access rule</h3>
            <p>{activeRules.length} rule đang quản lý</p>
          </div>
        </div>

        {activeRules.length > 0 ? (
          <div className="vehicle-list">
            {activeRules.map((rule) => (
              <div className="vehicle-row" key={rule.id}>
                <div className="vehicle-icon">
                  <Car className="w-5 h-5" />
                </div>
                <div className="vehicle-row-main">
                  <strong>{rule.plate}</strong>
                  <span>{formatRuleTypeLabel(rule.rule_type)}</span>
                  <p>{rule.description || "Không có mô tả"}</p>
                  <small>
                    {rule.valid_from
                      ? `Hiệu lực từ: ${formatVietnamDateTime(rule.valid_from)}`
                      : "Hiệu lực từ: không giới hạn"}
                  </small>
                </div>
                <em>{rule.status === 1 ? "Hoạt động" : "Đã xóa"}</em>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state compact">Chưa có access rule nào</div>
        )}
      </section>
    </div>
  );
}

export default VehiclePanel;
