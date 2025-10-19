#ifndef EVENT_H
#define EVENT_H

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

#endif  // EVENT_H
