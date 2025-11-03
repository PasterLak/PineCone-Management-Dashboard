#pragma once

#include <vector>

template <typename... Args>
class Event 
{
public:
    Event();
    void operator+=(void (*handler)(Args...));
    void operator-=(void (*handler)(Args...));
    void invoke(Args... args);

private:
    std::vector<void (*)(Args...)> handlers;
};
